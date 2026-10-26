"""AI Hub 인도 보행(Bbox) 데이터로 YOLO를 학습한다. 장애물 탐지(입간판, 화분, 가림막, 오토바이 등) 보강용.

Colab(T4 GPU)에서:
    !pip install -q ultralytics
    %run /content/drive/MyDrive/RoadPush_AI/train_yolo.py

하는 일
  1) Drive의 CVAT xml(box)을 YOLO 형식으로 바꾸고, 사진은 긴 변 1280으로 줄여 /content에 복사 (Drive에서 직접 읽으면 느림)
  2) 폴더 단위로 검증 분리 (VAL_NAMES 폴더, v1과 동일하게 고정). 연속 프레임이라 폴더를 나눠야 검증이 공정하다.
  3) 학습 결과는 OUT_DIR(Drive)에 저장 -> best.pt
  4) 클래스 이름 목록은 OUT_DIR/yolo_classes_bbox_v2.txt (서비스 설정에 쓸 번호를 여기서 확인)

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
STEP = 3             # 연속 프레임이라 N장 중 1장만 쓴다 (1이면 전부). 사진이 늘어서 2 -> 3
# 검증 폴더는 v1과 똑같이 고정한다 (새 폴더가 늘어도 이전 점수와 비교할 수 있게)
VAL_NAMES = {"Bbox_0711", "Bbox_0712", "Bbox_0713", "Bbox_0714"}
# 클래스 목록과 순서도 v1과 똑같이 고정한다 (config의 yolo.obstacle_class_ids 번호가 그대로 유효하도록)
CLASSES = ["car", "pole", "bollard", "person", "tree_trunk", "traffic_light", "traffic_sign", "movable_signage",
           "truck", "potted_plant", "motorcycle", "bicycle", "bus", "chair", "barricade", "bench", "stop",
           "power_controller", "traffic_light_controller", "carrier", "fire_hydrant", "table", "kiosk"]
MAX_SIDE = 1280
RUN_NAME = "bbox_v2"
# v1 가중치에서 이어서 학습한다 (처음부터 하면 시간이 두 배). 없으면 yolov8s.pt로 시작.
V1 = "/content/drive/MyDrive/RoadPush_AI/yolo_runs/bbox_v1/weights/best.pt"
MODEL = V1 if os.path.exists(V1) else "yolov8s.pt"
FALLBACK_VAL = False
IMGSZ, EPOCHS, BATCH = 960, 20, 16


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


def pick_classes(items):
    """학습할 클래스는 CLASSES로 고정. cnt는 현황 출력용."""
    cnt = collections.Counter(b[0] for it in items for b in it["boxes"])
    return list(CLASSES), cnt


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
    global FALLBACK_VAL
    val_f = {it["folder"] for it in items if it["folder"] in VAL_NAMES}
    if len(val_f) != len(VAL_NAMES):
        print("주의: 검증 폴더 일부가 안 보입니다:", sorted(VAL_NAMES - val_f))
    if not val_f:  # 이전 검증 폴더가 없으면 지금 있는 폴더의 마지막 4개로 대신하고, v1도 같은 사진으로 다시 잰다
        folders = sorted({it["folder"] for it in items})
        val_f = set(folders[-4:])
        FALLBACK_VAL = True
        print("검증 폴더를 새로 정함:", sorted(val_f), "(v1 점수와 직접 비교 불가 -> v1을 같은 사진으로 다시 측정)")
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
    Path(OUT_DIR, f"yolo_classes_{RUN_NAME}.txt").write_text("\n".join(f"{i} {c}" for i, c in enumerate(classes)))
    if FALLBACK_VAL and os.path.exists(V1):
        print("\n[기준선] v1 모델을 같은 검증 사진으로 측정")
        YOLO(V1).val(data=data, imgsz=IMGSZ, plots=False)
    model = YOLO(MODEL)
    model.train(data=data, imgsz=IMGSZ, epochs=EPOCHS, batch=BATCH, patience=8, workers=2,
                project=OUT_DIR, name=RUN_NAME, exist_ok=True, seed=0)
    print("\n학습 끝. 가중치:", Path(OUT_DIR, RUN_NAME, "weights", "best.pt"))
    print("클래스 번호:", {i: c for i, c in enumerate(classes)})


if __name__ == "__main__":
    main()
