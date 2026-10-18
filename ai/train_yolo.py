"""AI Hub 인도 보행(Bbox) 데이터로 YOLO를 학습한다. 장애물 탐지(입간판, 화분, 가림막, 오토바이 등) 보강용.

Colab(T4 GPU)에서:
    !pip install -q ultralytics
    %run /content/drive/MyDrive/RoadPush_AI/train_yolo.py

하는 일
  1) Drive의 CVAT xml(box)을 YOLO 형식으로 바꾸고, 사진은 긴 변 1280으로 줄여 /content에 복사 (Drive에서 직접 읽으면 느림)
  2) 폴더 단위로 검증 분리 (마지막 VAL_FOLDERS개 폴더). 연속 프레임이라 폴더를 나눠야 검증이 공정하다.
  3) 학습 결과는 OUT_DIR(Drive)에 저장 -> best.pt
  4) 클래스 이름 목록은 OUT_DIR/yolo_classes.txt (서비스 설정에 쓸 번호를 여기서 확인)

고정 시설물(pole, bollard 등)도 같이 학습한다. 서비스에서 어떤 클래스를 장애물로 볼지는 config의 yolo.obstacle_class_ids로 고른다.
"""
import collections
import glob
import os
import shutil
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

ROOT = "/content/drive/MyDrive/RoadPush_AI/RoadPush_Data"
OUT_DIR = "/content/drive/MyDrive/RoadPush_AI/yolo_runs"
WORK = "/content/yolo_data"
STEP = 2             # 연속 프레임이라 N장 중 1장만 쓴다 (1이면 전부)
VAL_FOLDERS = 4      # 마지막 N개 폴더는 검증용
MIN_BOXES = 200      # 이보다 박스가 적은 클래스(킥보드, 유모차 등)는 학습에서 뺀다
MAX_SIDE = 1280
MODEL = "yolov8s.pt"
IMGSZ, EPOCHS, BATCH = 960, 30, 16


def load_items(root):
    items = []
    for xf in sorted(glob.glob(root + "/*/Bbox_*/*.xml")):
        folder = os.path.dirname(xf)
        for im in ET.parse(xf).getroot().iter("image"):
            path = os.path.join(folder, im.get("name"))
            if not os.path.exists(path):
                continue
            boxes = [(b.get("label"), float(b.get("xtl")), float(b.get("ytl")), float(b.get("xbr")), float(b.get("ybr")))
                     for b in im.findall("box")]
            items.append({"folder": os.path.basename(folder), "path": path, "name": im.get("name"),
                          "w": float(im.get("width")), "h": float(im.get("height")), "boxes": boxes})
    return items


def pick_classes(items, min_boxes=None):
    min_boxes = MIN_BOXES if min_boxes is None else min_boxes
    cnt = collections.Counter(b[0] for it in items for b in it["boxes"])
    return [c for c, n in cnt.most_common() if n >= min_boxes], cnt


def to_yolo_lines(it, cls_index):
    """박스를 'class cx cy w h'(0~1) 줄로. 화면 밖으로 나간 부분은 자르고 너무 작은 박스는 버린다."""
    lines = []
    for lab, x1, y1, x2, y2 in it["boxes"]:
        if lab not in cls_index:
            continue
        x1, x2 = max(0.0, min(x1, it["w"])), max(0.0, min(x2, it["w"]))
        y1, y2 = max(0.0, min(y1, it["h"])), max(0.0, min(y2, it["h"]))
        if x2 - x1 < 2 or y2 - y1 < 2:
            continue
        lines.append(f"{cls_index[lab]} {(x1 + x2) / 2 / it['w']:.6f} {(y1 + y2) / 2 / it['h']:.6f} "
                     f"{(x2 - x1) / it['w']:.6f} {(y2 - y1) / it['h']:.6f}")
    return lines


def prepare(root=ROOT, work=WORK):
    items = load_items(root)
    folders = sorted({it["folder"] for it in items})
    val_f = set(folders[-VAL_FOLDERS:])
    classes, cnt = pick_classes(items)
    cls_index = {c: i for i, c in enumerate(classes)}
    print("사진", len(items), "장 / 학습에 쓰는 클래스", len(classes), "개 (제외:", [c for c in cnt if c not in cls_index], ")")

    sel, seen = [], collections.Counter()
    for it in items:  # 폴더별로 STEP장에 1장
        k = seen[it["folder"]]
        seen[it["folder"]] += 1
        if k % STEP == 0:
            sel.append(it)

    work = Path(work)
    if work.exists():
        shutil.rmtree(work)
    for split in ("train", "val"):
        (work / "images" / split).mkdir(parents=True)
        (work / "labels" / split).mkdir(parents=True)

    def one(it):
        split = "val" if it["folder"] in val_f else "train"
        stem = f"{it['folder']}_{Path(it['name']).stem}"
        img = Image.open(it["path"]).convert("RGB")
        img.thumbnail((MAX_SIDE, MAX_SIDE))
        img.save(work / "images" / split / f"{stem}.jpg", quality=92)
        (work / "labels" / split / f"{stem}.txt").write_text("\n".join(to_yolo_lines(it, cls_index)))
        return split

    with ThreadPoolExecutor(8) as ex:
        splits = list(ex.map(one, sel))
    print("학습", splits.count("train"), "장 / 검증", splits.count("val"), "장 (검증 폴더:", sorted(val_f), ")")

    yaml = f"path: {work}\ntrain: images/train\nval: images/val\nnames:\n" + "".join(f"  {i}: {c}\n" for i, c in enumerate(classes))
    (work / "data.yaml").write_text(yaml)
    return str(work / "data.yaml"), classes


def main():
    from ultralytics import YOLO

    data, classes = prepare()
    os.makedirs(OUT_DIR, exist_ok=True)
    Path(OUT_DIR, "yolo_classes.txt").write_text("\n".join(f"{i} {c}" for i, c in enumerate(classes)))
    model = YOLO(MODEL)
    model.train(data=data, imgsz=IMGSZ, epochs=EPOCHS, batch=BATCH, patience=10, workers=2,
                project=OUT_DIR, name="bbox_v1", exist_ok=True, seed=0)
    print("\n학습 끝. 가중치:", Path(OUT_DIR, "bbox_v1", "weights", "best.pt"))
    print("클래스 번호:", {i: c for i, c in enumerate(classes)})


if __name__ == "__main__":
    main()
