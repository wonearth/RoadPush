"""AI Hub 인도 보행(Surface) 데이터로 SegFormer의 보도/차도 구분을 미세조정한다.

Colab에서:  %run /content/drive/MyDrive/RoadPush_AI/train_surface.py
  (GPU 런타임, 처음 사진을 읽는 데 몇 분, 학습은 약 15분)

정답 만들기
  보도 = sidewalk + braille_guide_blocks + caution_zone  -> Cityscapes 'sidewalk'(1)
  차도 = roadway + alley + bike_lane                      -> Cityscapes 'road'(0)
  라벨이 없는 부분은 원래 모델의 예측을 정답으로 쓴다 (자동차, 건물 등 다른 클래스를 잊지 않도록).
  단, 원래 모델이 도로/보도로 읽은 라벨 없는 부분은 틀릴 수 있어 학습에서 제외한다.
검증: 마지막 폴더 몇 개를 학습에서 빼고, 학습 전/후의 보도·차도 IoU를 비교한다.
결과: OUT 폴더에 저장 (roadpush config의 seg_model에 이 경로를 넣으면 된다).
"""
import glob
import os
import xml.etree.ElementTree as ET

import cv2
import numpy as np
from PIL import Image

BASE = "/content/drive/MyDrive/RoadPush_AI/RoadPush_Data/공공 데이터(AI Hub)"
NAME = "nvidia/segformer-b0-finetuned-cityscapes-1024-1024"
OUT = "/content/drive/MyDrive/RoadPush_AI/seg_finetuned"
W, H = 768, 432
EPOCHS, BS, LR = 8, 8, 1e-4
VAL_FOLDERS = 3
IGN = 255
WALK = {"sidewalk", "braille_guide_blocks", "caution_zone"}
ROAD = {"roadway", "alley", "bike_lane"}


def load_items(base):
    items = []
    for xf in sorted(glob.glob(base + "/Surface_*/*.xml")):
        folder = os.path.dirname(xf)
        for im in ET.parse(xf).getroot().iter("image"):
            path = os.path.join(folder, im.get("name"))
            if not os.path.exists(path):
                continue
            polys = []
            for p in im.findall("polygon"):
                lab = p.get("label")
                if lab in WALK or lab in ROAD:
                    pts = np.array([[float(a), float(b)] for a, b in (q.split(",") for q in p.get("points").split(";"))], np.float32)
                    polys.append((1 if lab in WALK else 0, pts))
            items.append({"folder": folder, "path": path, "w": float(im.get("width")), "h": float(im.get("height")), "polys": polys})
    return items


def rasterize(it):
    """폴리곤 -> (H, W) 라벨. 0=차도, 1=보도, 255=라벨 없음. 차도를 먼저 칠하고 보도를 위에 덮는다."""
    y = np.full((H, W), IGN, np.uint8)
    for cls in (0, 1):
        for c, pts in it["polys"]:
            if c == cls:
                q = (pts * np.array([W / it["w"], H / it["h"]], np.float32)).round().astype(np.int32)
                cv2.fillPoly(y, [q], int(c))
    return y


def cache(items):
    from tqdm import tqdm

    X = np.zeros((len(items), H, W, 3), np.uint8)
    Y = np.zeros((len(items), H, W), np.uint8)
    for i, it in enumerate(tqdm(items, desc="사진 읽는 중")):
        X[i] = np.asarray(Image.open(it["path"]).convert("RGB").resize((W, H), Image.BILINEAR))
        Y[i] = rasterize(it)
    return X, Y


def main():
    import torch
    import torch.nn.functional as F
    from transformers import SegformerForSemanticSegmentation, SegformerImageProcessor

    dev = "cuda" if torch.cuda.is_available() else "cpu"
    if dev == "cpu":
        print("주의: GPU가 아닙니다. 런타임 > 런타임 유형 변경에서 T4 GPU를 고르세요.")
    torch.manual_seed(0)
    np.random.seed(0)

    items = load_items(BASE)
    folders = sorted({it["folder"] for it in items})
    val_f = set(folders[-VAL_FOLDERS:])
    tr_idx = [i for i, it in enumerate(items) if it["folder"] not in val_f]
    va_idx = [i for i, it in enumerate(items) if it["folder"] in val_f]
    print(f"사진 {len(items)}장 (학습 {len(tr_idx)}, 검증 {len(va_idx)}), 검증 폴더: {[os.path.basename(f) for f in sorted(val_f)]}")
    X, Y = cache(items)

    mean = torch.tensor([0.485, 0.456, 0.406], device=dev).view(1, 3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225], device=dev).view(1, 3, 1, 1)
    teacher = SegformerForSemanticSegmentation.from_pretrained(NAME).to(dev).eval()
    student = SegformerForSemanticSegmentation.from_pretrained(NAME).to(dev)

    def to_input(x_u8):
        x = torch.from_numpy(x_u8).to(dev).permute(0, 3, 1, 2).float() / 255.0
        return x

    def predict(model, x01):
        with torch.no_grad(), torch.autocast(dev, dtype=torch.float16, enabled=dev == "cuda"):
            lg = model(pixel_values=(x01 - mean) / std).logits
        return F.interpolate(lg.float(), size=(H, W), mode="bilinear", align_corners=False).argmax(1)

    def evaluate(model):
        model.eval()
        wi = wu = ri = ru = 0
        for i in range(0, len(va_idx), 16):
            ids = va_idx[i:i + 16]
            pred = predict(model, to_input(X[ids]))
            gt = torch.from_numpy(Y[ids]).to(dev)
            valid = gt != IGN
            pw, pr = (pred == 1) & valid, (pred == 0) & valid
            gw, gr = gt == 1, gt == 0
            wi += int((pw & gw).sum()); wu += int((pw | gw).sum())
            ri += int((pr & gr).sum()); ru += int((pr | gr).sum())
        return wi / max(1, wu), ri / max(1, ru)

    w0, r0 = evaluate(teacher)
    print(f"[학습 전] 검증 보도 IoU {w0:.3f}  차도 IoU {r0:.3f}")

    opt = torch.optim.AdamW(student.parameters(), lr=LR, weight_decay=0.01)
    steps = EPOCHS * (len(tr_idx) // BS)
    sched = torch.optim.lr_scheduler.LambdaLR(opt, lambda s: max(0.0, 1 - s / steps))
    scaler = torch.cuda.amp.GradScaler(enabled=dev == "cuda")
    best = -1.0
    for ep in range(EPOCHS):
        student.train()
        perm = np.random.permutation(tr_idx)
        tot = n = 0
        for i in range(0, len(perm) - BS + 1, BS):
            ids = perm[i:i + BS]
            x, y = X[ids].copy(), Y[ids].copy()
            for k in range(BS):  # 좌우 뒤집기
                if np.random.rand() < 0.5:
                    x[k], y[k] = x[k][:, ::-1], y[k][:, ::-1]
            xt = to_input(x)
            c = torch.empty(BS, 1, 1, 1, device=dev).uniform_(0.8, 1.2)  # 밝기·대비
            b = torch.empty(BS, 1, 1, 1, device=dev).uniform_(-0.1, 0.1)
            xt = ((xt - 0.5) * c + 0.5 + b).clamp(0, 1)
            tl = predict(teacher, xt)
            yt = torch.from_numpy(np.ascontiguousarray(y)).long().to(dev)
            fill = (yt == IGN) & (tl != 0) & (tl != 1)  # 라벨 없는 곳: 원래 모델이 도로/보도가 아니라고 본 곳만 그대로 유지
            yt = torch.where(fill, tl, yt)
            with torch.autocast(dev, dtype=torch.float16, enabled=dev == "cuda"):
                loss = student(pixel_values=(xt - mean) / std, labels=yt).loss
            opt.zero_grad(set_to_none=True)
            scaler.scale(loss).backward()
            scaler.step(opt)
            scaler.update()
            sched.step()
            tot += float(loss); n += 1
        wi, ri = evaluate(student)
        print(f"에폭 {ep + 1}/{EPOCHS}  loss {tot / max(1, n):.3f}  검증 보도 IoU {wi:.3f}  차도 IoU {ri:.3f}")
        if wi + ri > best:
            best = wi + ri
            student.save_pretrained(OUT)
            SegformerImageProcessor.from_pretrained(NAME).save_pretrained(OUT)
            print(f"  -> 저장: {OUT}")
    print(f"\n[학습 전] 보도 {w0:.3f} 차도 {r0:.3f}  ->  [최고] 합계 {best:.3f} (보도+차도)")


if __name__ == "__main__":
    main()
