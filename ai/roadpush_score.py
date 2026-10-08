#!/usr/bin/env python3
"""RoadPush 기본 파이프라인: 사진 -> 보도/장애물 마스크 -> 보행공간 단절 위험도(0~100).

사용 예:
    python roadpush_score.py --images ./02_Selected --out preds.csv --vis ./vis
    python roadpush_score.py --images ./02_Selected --out preds.csv --yolo yolov8n.pt

설정(가중치·임계값·모델 이름)은 config.json에서 바꾼다.
점수 산식은 score_masks()에 모델과 분리해 두었으므로, 모델 없이 마스크만으로 테스트할 수 있다.
"""
import argparse
import csv
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps

try:  # HEIC를 직접 읽고 싶을 때만 필요: pip install pillow-heif
    from pillow_heif import register_heif_opener

    register_heif_opener()
except ImportError:
    pass

STAGES = ["안전", "주의", "경고", "위험"]
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".heic"}


def load_config(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def stage_of(score, thresholds):
    """0~25 안전, 26~50 주의, 51~75 경고, 76~100 위험 (thresholds=[25,50,75])."""
    return int(sum(score > t for t in thresholds))


def score_masks(sidewalk, obstacle, cfg):
    """보도 마스크와 장애물 마스크(bool, HxW)로 위험도를 계산한다.

    원래 보행 가능 영역 = 보도 + 보도에 붙어 있는 장애물 픽셀
    남은 영역           = 보도 - 장애물
    반환: dict, 보도를 못 찾았으면 None
    """
    h, w = sidewalk.shape
    k = max(3, int(cfg["dilate_ratio"] * w))
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    near = cv2.dilate(sidewalk.astype(np.uint8), kernel) > 0

    orig = sidewalk | (obstacle & near)
    remain = sidewalk & ~obstacle

    n_orig = int(orig.sum())
    if n_orig < cfg["min_area_ratio"] * h * w:
        return None

    rows = np.where(orig.any(axis=1))[0]
    y0, y1 = int(rows.min()), int(rows.max())
    extent = y1 - y0 + 1

    # 남은 영역 중 가장 큰 연결 덩어리 = 실제로 이어서 걸을 수 있는 길
    n, labels, stats, _ = cv2.connectedComponentsWithStats(
        remain.astype(np.uint8), connectivity=8
    )
    if n <= 1:
        lcc = np.zeros_like(remain)
        vcov = 0.0
    else:
        idx = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        lcc = labels == idx
        vcov = float(stats[idx, cv2.CC_STAT_HEIGHT]) / extent  # 세로 연속성

    ow = orig[y0 : y1 + 1].sum(axis=1)
    rw = lcc[y0 : y1 + 1].sum(axis=1)
    valid = ow > 0
    row_ratio = rw[valid] / ow[valid]
    choke = float(np.percentile(row_ratio, cfg["choke_percentile"]))  # 가장 좁은 구간의 남은 폭 비율

    walkable_ratio = float(remain.sum()) / n_orig
    departure = (vcov < cfg["vcov_min"]) or (choke < cfg["choke_min"])

    erosion = 100.0 * (1.0 - walkable_ratio)
    disconnect = 100.0 * max(1.0 - vcov, 1.0 - min(1.0, choke / cfg["choke_ok"]))
    w_ = cfg["weights"]
    risk = (
        w_["erosion"] * erosion
        + w_["disconnect"] * disconnect
        + w_["departure"] * (100.0 if departure else 0.0)
    )
    risk = round(min(100.0, max(0.0, risk)), 1)

    return {
        "riskScore": risk,
        "stage": STAGES[stage_of(risk, cfg["stage_thresholds"])],
        "walkableRatio": round(walkable_ratio, 3),
        "continuity": round(vcov, 3),
        "choke": round(choke, 3),
        "disconnected": bool(departure),
    }


def virtual_strip(cmap, obstacle, cfg):
    """보도를 못 찾았을 때(경계 없는 보차혼용 골목) 쓰는 대체 규칙.

    도로(road) 영역에서 건물 쪽 가장자리부터 도로 폭의 strip_ratio만큼을 '가상 보행 띠'로 본다.
    건물이 있는 쪽은 아래쪽(가까운) 행일수록 큰 가중치를 두고 좌/우를 고른다.
    반환: (strip bool 마스크, 건물 쪽 'left'|'right') 또는 (None, None)
    """
    fb = cfg.get("fallback", {})
    if not fb.get("enabled", True):
        return None, None
    h, w = cmap.shape
    road = cmap == fb.get("road_id", 0)
    bld = np.isin(cmap, fb.get("building_ids", [2, 3, 4]))
    y0 = int(h * fb.get("min_row_ratio", 0.35))
    if road[y0:].sum() < cfg["min_area_ratio"] * h * w:
        return None, None

    wts = np.arange(h, dtype=float)[:, None] + 1.0
    left_score = float((bld[:, : w // 2] * wts[:, :1]).sum())
    right_score = float((bld[:, w // 2 :] * wts[:, :1]).sum())
    side = "left" if left_score >= right_score else "right"

    free = road | obstacle  # 장애물이 가린 부분도 원래 길로 본다
    strip = np.zeros((h, w), dtype=bool)
    ratio = fb.get("strip_ratio", 0.25)
    for y in range(y0, h):
        r = np.where(road[y])[0]
        if len(r) < 5:
            continue
        f = np.where(free[y])[0]
        if side == "left":
            edge, far = int(f.min()), int(r.max())
            strip[y, edge : edge + int(ratio * max(far - edge, 1)) + 1] = True
        else:
            edge, far = int(f.max()), int(r.min())
            strip[y, max(edge - int(ratio * max(edge - far, 1)), 0) : edge + 1] = True
    return strip, side


class Segmenter:
    """사전학습 SegFormer. 처음 실행하면 모델 가중치를 내려받는다."""

    def __init__(self, name):
        import torch
        from transformers import SegformerForSemanticSegmentation, SegformerImageProcessor

        self.torch = torch
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.proc = SegformerImageProcessor.from_pretrained(name)
        self.model = SegformerForSemanticSegmentation.from_pretrained(name).to(self.device).eval()

    def predict(self, img):
        """PIL RGB -> (H, W) 클래스 id 맵"""
        inputs = self.proc(images=img, return_tensors="pt").to(self.device)
        with self.torch.no_grad():
            out = self.model(**inputs)
        seg = self.proc.post_process_semantic_segmentation(out, target_sizes=[img.size[::-1]])[0]
        return seg.cpu().numpy()


def yolo_mask(yolo, img, shape, class_ids, conf):
    """YOLO 박스를 마스크로 바꾼다. 박스는 실제 물체보다 크므로 점유를 약간 과대평가한다."""
    res = yolo.predict(img, conf=conf, verbose=False)[0]
    m = np.zeros(shape, dtype=bool)
    for b in res.boxes:
        if int(b.cls) in class_ids:
            x1, y1, x2, y2 = (int(v) for v in b.xyxy[0].tolist())
            m[max(0, y1) : y2, max(0, x1) : x2] = True
    return m


def load_image(path, max_side):
    img = ImageOps.exif_transpose(Image.open(path)).convert("RGB")  # 폰 사진 회전 보정
    img.thumbnail((max_side, max_side))
    return img


def save_vis(img, remain, obstacle, path, text):
    arr = np.array(img)
    layer = arr.copy()
    layer[remain] = (0, 200, 0)  # 남은 보행공간: 초록
    layer[obstacle] = (230, 0, 0)  # 장애물: 빨강
    out = cv2.addWeighted(arr, 0.55, layer, 0.45, 0)
    cv2.putText(out, text, (12, 36), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 3)
    cv2.putText(out, text, (12, 36), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 0), 1)
    Image.fromarray(out).save(path)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--images", required=True, help="사진 폴더 (하위 폴더 포함)")
    ap.add_argument("--out", default="preds.csv")
    ap.add_argument("--config", default="config.json")
    ap.add_argument("--vis", default=None, help="결과 오버레이 이미지를 저장할 폴더")
    ap.add_argument("--yolo", default=None, help="YOLO 가중치(예: yolov8n.pt). 생략하면 SegFormer만 사용")
    ap.add_argument("--max-side", type=int, default=1280, help="긴 변을 이 크기로 줄여서 처리")
    args = ap.parse_args()

    cfg = load_config(args.config)
    seg = Segmenter(cfg["seg_model"])
    yolo = None
    yolo_weights = args.yolo or cfg["yolo"].get("weights")
    if yolo_weights:
        from ultralytics import YOLO

        yolo = YOLO(yolo_weights)

    files = sorted(p for p in Path(args.images).rglob("*") if p.suffix.lower() in IMAGE_SUFFIXES)
    if not files:
        raise SystemExit(f"사진이 없습니다: {args.images}")
    if args.vis:
        Path(args.vis).mkdir(parents=True, exist_ok=True)

    fields = ["photo", "riskScore", "stage", "walkableRatio", "continuity", "choke", "disconnected", "note"]
    rows = []
    for i, p in enumerate(files, 1):
        img = load_image(p, args.max_side)
        cmap = seg.predict(img)
        sidewalk = cmap == cfg["classes"]["sidewalk"]
        obstacle = np.isin(cmap, cfg["classes"]["obstacle_ids"])
        if yolo is not None:
            obstacle |= yolo_mask(yolo, img, cmap.shape, cfg["yolo"]["obstacle_class_ids"], cfg["yolo"]["conf"])

        res = score_masks(sidewalk, obstacle, cfg)
        note = ""
        if res is None:  # 보도를 못 찾음 -> 가상 보행 띠로 대체
            strip, side = virtual_strip(cmap, obstacle, cfg)
            if strip is not None:
                sidewalk = strip
                res = score_masks(sidewalk, obstacle, cfg)
                note = f"경계 추정(가상 띠, 건물 {side})"
        if res is None:
            rows.append({"photo": p.name, "note": "보도 미검출"})
            print(f"[{i}/{len(files)}] {p.name}: 보도 미검출")
            continue
        rows.append({"photo": p.name, **res, "note": note})
        print(f"[{i}/{len(files)}] {p.name}: {res['riskScore']} ({res['stage']}) {note}")
        if args.vis:
            save_vis(img, sidewalk & ~obstacle, obstacle, Path(args.vis) / f"{p.stem}_vis.jpg",
                     f"risk {res['riskScore']}")

    with open(args.out, "w", newline="", encoding="utf-8-sig") as f:
        wr = csv.DictWriter(f, fieldnames=fields)
        wr.writeheader()
        wr.writerows(rows)
    print(f"저장: {args.out} ({len(rows)}장)")


if __name__ == "__main__":
    main()
