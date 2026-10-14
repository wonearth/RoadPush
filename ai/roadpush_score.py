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
import os
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


def _merge(base, extra):
    for k, v in extra.items():
        if isinstance(v, dict) and isinstance(base.get(k), dict):
            _merge(base[k], v)
        else:
            base[k] = v
    return base


def load_config(path):
    """config.json을 읽고, 같은 폴더의 config.private.json(깃에 올리지 않는 파일)이 있으면 위에 덮어쓴다.
    점수 가중치(weights)는 공개 저장소에 두지 않으므로 config.private.json 또는 환경변수
    ROADPUSH_WEIGHTS="0.5,0.3,0.2" (erosion,disconnect,departure 순서)로 넣는다."""
    path = Path(path)
    with open(path, encoding="utf-8") as f:
        cfg = json.load(f)
    private = Path(os.environ.get("ROADPUSH_PRIVATE_CONFIG", path.with_name(path.stem + ".private.json")))
    if private.exists():
        with open(private, encoding="utf-8") as f:
            _merge(cfg, json.load(f))
    if "weights" not in cfg and os.environ.get("ROADPUSH_WEIGHTS"):
        e, d, p = (float(x) for x in os.environ["ROADPUSH_WEIGHTS"].split(","))
        cfg["weights"] = {"erosion": e, "disconnect": d, "departure": p}
    if "weights" not in cfg:
        raise SystemExit("점수 가중치가 없습니다. config.private.json을 같은 폴더에 두거나 환경변수 ROADPUSH_WEIGHTS를 설정하세요.")
    return cfg


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
    # 보도에 붙은 장애물로 칠 범위. 기본은 dilate_ratio. obstacle_near_ratio를 키우면 보도 위를 크게 가린 장애물
    # (분할 모델이 그 부분을 보도가 아니라 차량 등으로 읽어 보도에 구멍이 난 경우)도 원래 길로 이어 붙인다.
    k = max(3, int(cfg.get("obstacle_near_ratio", cfg["dilate_ratio"]) * w))
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    near = cv2.dilate(sidewalk.astype(np.uint8), kernel) > 0

    orig = sidewalk | (obstacle & near)

    # 원래 길 중 가장 큰 덩어리를 '기준 보행로'로 삼는다 (장애물과 무관한 조각 분리에 벌점을 주지 않기 위해)
    n0, lab0, st0, _ = cv2.connectedComponentsWithStats(orig.astype(np.uint8), connectivity=8)
    if n0 <= 1:
        return None
    i0 = 1 + int(np.argmax(st0[1:, cv2.CC_STAT_AREA]))
    orig = lab0 == i0
    n_orig = int(orig.sum())
    if n_orig < cfg["min_area_ratio"] * h * w:
        return None

    remain = sidewalk & ~obstacle & orig
    rows = np.where(orig.any(axis=1))[0]
    y0, y1 = int(rows.min()), int(rows.max())
    extent = y1 - y0 + 1

    # 남은 영역 중 가장 큰 연결 덩어리 = 실제로 이어서 걸을 수 있는 길
    n, labels, stats, _ = cv2.connectedComponentsWithStats(remain.astype(np.uint8), connectivity=8)
    if n <= 1:
        lcc = np.zeros_like(remain)
        vcov = 0.0
    else:
        idx = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        lcc = labels == idx
        vcov = min(1.0, float(stats[idx, cv2.CC_STAT_HEIGHT]) / extent)  # 세로 연속성

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


def clean_mask(mask, min_ratio):
    """작은 조각(잡음)을 지운다."""
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), connectivity=8)
    out = np.zeros_like(mask)
    min_area = min_ratio * mask.size
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] >= min_area:
            out[labels == i] = True
    return out


def green_pavement(img, cmap, cfg):
    """녹색 포장(보행 우선 구간)을 색으로 찾는다. 도로/보도로 분류된 영역 안, 화면 아래쪽에서만 찾는다."""
    gc = cfg.get("green_pavement", {})
    if not gc.get("enabled", False):
        return None
    arr = np.array(img)
    hsv = cv2.cvtColor(arr, cv2.COLOR_RGB2HSV)
    h, w = cmap.shape
    m = (
        (hsv[..., 0] >= gc["h_min"]) & (hsv[..., 0] <= gc["h_max"])
        & (hsv[..., 1] >= gc["s_min"]) & (hsv[..., 2] >= gc["v_min"])
        & np.isin(cmap, gc.get("allowed_class_ids", [0, 1]))
    )
    m[: int(h * gc.get("min_row_ratio", 0.4))] = False
    m = m.astype(np.uint8)
    k = max(5, int(0.02 * w))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    return clean_mask(m > 0, gc.get("min_component_ratio", 0.01))


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


class OpenVocabDetector:
    """글자로 물체를 찾는 탐지기(OWLv2). 입간판·옷걸이·상자 같은 기본 모델이 모르는 적치물을 찾는 용도.
    사람은 장애물로 치지 않는다(labels에 넣지 않는다). 박스는 실제 물체보다 크므로 점유를 약간 과대평가한다."""

    def __init__(self, ov):
        import torch
        from transformers import pipeline

        self.pipe = pipeline(
            "zero-shot-object-detection", model=ov["model"], device=0 if torch.cuda.is_available() else -1
        )
        self.labels = ov["labels"]
        self.thr = ov.get("threshold", 0.25)
        self.max_area = ov.get("max_area_ratio", 0.5)
        self.shrink = ov.get("shrink", 0.0)  # 박스 가장자리를 이 비율만큼 안으로 줄인다 (0.1 = 사방 10%)

    def detect(self, img, shape):
        """감지된 물체 목록 [{label, score, box=(x1,y1,x2,y2)}]. 박스는 shrink를 적용한 값."""
        h, w = shape
        out = []
        for r in self.pipe(img, candidate_labels=self.labels):
            if r["score"] < self.thr:
                continue
            b = r["box"]
            x1, y1, x2, y2 = int(b["xmin"]), int(b["ymin"]), int(b["xmax"]), int(b["ymax"])
            if (x2 - x1) * (y2 - y1) > self.max_area * h * w:  # 건물 전체 같은 너무 큰 박스는 버린다
                continue
            dx, dy = int((x2 - x1) * self.shrink), int((y2 - y1) * self.shrink)
            out.append({"label": r["label"], "score": float(r["score"]), "box": (x1 + dx, y1 + dy, x2 - dx, y2 - dy)})
        return out

    def mask(self, img, shape):
        return boxes_to_mask(self.detect(img, shape), shape)


def fill_box(m, box):
    x1, y1, x2, y2 = box
    m[max(0, y1) : max(0, y2), max(0, x1) : max(0, x2)] = True


def boxes_to_mask(dets, shape):
    m = np.zeros(shape, dtype=bool)
    for d in dets:
        fill_box(m, d["box"])
    return m


def yolo_detect(yolo, img, class_ids, conf):
    """YOLO 감지 목록 [{cls, score, box}]. 박스는 실제 물체보다 크므로 점유를 약간 과대평가한다."""
    res = yolo.predict(img, conf=conf, verbose=False)[0]
    out = []
    for b in res.boxes:
        if int(b.cls) in class_ids:
            x1, y1, x2, y2 = (int(v) for v in b.xyxy[0].tolist())
            out.append({"cls": int(b.cls), "score": float(b.conf), "box": (x1, y1, x2, y2)})
    return out


def yolo_mask(yolo, img, shape, class_ids, conf):
    return boxes_to_mask(yolo_detect(yolo, img, class_ids, conf), shape)


def load_image(path, max_side):
    img = ImageOps.exif_transpose(Image.open(path)).convert("RGB")  # 폰 사진 회전 보정
    img.thumbnail((max_side, max_side))
    return img


def analyze_image(img, cfg, seg, yolo=None, ov=None):
    """사진 한 장을 분석한다. CLI(main)와 API 서버가 같은 함수를 쓰므로 결과가 항상 같다.

    반환 dict
      res        score_masks 결과 (보도를 못 찾았으면 None)
      notes      처리 메모 목록
      cmap       클래스 id 맵
      sidewalk   점수 계산에 쓴 최종 보행 영역 (모델 보도 + 녹색 포장, 또는 가상 띠)
      model_sw   모델이 찾은 보도
      green      녹색 포장 단서 마스크 (없으면 None)
      strip      가상 띠 마스크 (안 썼으면 None)
      obstacle   장애물 마스크
      parts      장애물 조각 목록 [{source, key, mask(bool), box, score}]  (유형 분류·박스 표시용)
    """
    cmap = seg.predict(img)
    sidewalk = clean_mask(cmap == cfg["classes"]["sidewalk"], cfg.get("min_component_ratio", 0.003))
    seg_ids = cfg["classes"]["obstacle_ids"]
    obstacle = np.isin(cmap, seg_ids)
    parts = []
    for cid in seg_ids:
        m = cmap == cid
        n, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8), connectivity=8)
        for i in range(1, n):
            x, y, w_, h_, a = (int(v) for v in st[i])
            if a >= cfg.get("min_component_ratio", 0.003) * m.size:
                parts.append({"source": "seg", "key": int(cid), "mask": lab == i, "box": (x, y, x + w_, y + h_), "score": None})
    if yolo is not None:
        for d in yolo_detect(yolo, img, cfg["yolo"]["obstacle_class_ids"], cfg["yolo"]["conf"]):
            m = np.zeros(cmap.shape, dtype=bool)
            fill_box(m, d["box"])
            obstacle |= m
            parts.append({"source": "yolo", "key": d["cls"], "mask": m, "box": d["box"], "score": d["score"]})
    if ov is not None:
        for d in ov.detect(img, cmap.shape):
            m = np.zeros(cmap.shape, dtype=bool)
            fill_box(m, d["box"])
            obstacle |= m
            parts.append({"source": "owl", "key": d["label"], "mask": m, "box": d["box"], "score": d["score"]})

    notes = []
    model_sw = sidewalk.copy()
    g = green_pavement(img, cmap, cfg)
    if g is not None and g.any():
        sidewalk = sidewalk | g
        notes.append(f"녹색포장 단서({g.mean() * 100:.1f}%)")
    strip_used = None

    res = None
    trigger = cfg.get("fallback", {}).get("trigger_ratio", 0.03)
    if sidewalk.mean() >= trigger:
        res = score_masks(sidewalk, obstacle, cfg)
    if res is None:  # 보도가 없거나 너무 작음 -> 가상 보행 띠로 대체
        strip, side = virtual_strip(cmap, obstacle, cfg)
        if strip is not None:
            sidewalk = strip
            strip_used = strip
            res = score_masks(sidewalk, obstacle, cfg)
            notes.append(f"경계 추정(가상 띠, 건물 {side})")
    return {
        "res": res, "notes": notes, "cmap": cmap, "sidewalk": sidewalk, "model_sw": model_sw,
        "green": g, "strip": strip_used, "obstacle": obstacle, "parts": parts,
    }


def save_vis(img, layers, obstacle, path, text):
    """layers: [(마스크, (R,G,B)), ...]  초록=모델이 찾은 보도, 보라=녹색 포장 색 단서, 파랑=가상 보행 띠, 빨강=장애물"""
    arr = np.array(img)
    layer = arr.copy()
    for mask, color in layers:
        layer[mask] = color
    layer[obstacle] = (230, 0, 0)
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
    ap.add_argument("--owl", action="store_true", help="글자로 적치물을 찾는 탐지기(OWLv2)를 추가로 사용")
    ap.add_argument("--max-side", type=int, default=1280, help="긴 변을 이 크기로 줄여서 처리")
    args = ap.parse_args()

    cfg = load_config(args.config)
    seg = Segmenter(cfg["seg_model"])
    yolo = None
    yolo_weights = args.yolo or cfg["yolo"].get("weights")
    if yolo_weights:
        from ultralytics import YOLO

        yolo = YOLO(yolo_weights)

    # 드라이브 바로가기(심볼릭 링크) 폴더도 따라 들어가도록 os.walk(followlinks=True)를 쓴다
    ov = None
    if args.owl or cfg.get("open_vocab", {}).get("enabled", False):
        ov = OpenVocabDetector(cfg["open_vocab"])

    files = []
    for root, _dirs, names in os.walk(args.images, followlinks=True):
        for n in names:
            if Path(n).suffix.lower() in IMAGE_SUFFIXES:
                files.append(Path(root) / n)
    files = sorted(files)
    if not files:
        raise SystemExit(
            f"사진이 없습니다: {Path(args.images).resolve()} (폴더가 있는지, 현재 위치가 RoadPush_AI인지 확인하세요)"
        )
    print(f"사진 {len(files)}장 발견: {Path(args.images).resolve()}")
    if args.vis:
        Path(args.vis).mkdir(parents=True, exist_ok=True)

    fields = ["photo", "riskScore", "stage", "walkableRatio", "continuity", "choke", "disconnected", "note"]
    rows = []
    for i, p in enumerate(files, 1):
        rel = p.relative_to(args.images).as_posix()  # 폴더가 여러 개일 때 같은 파일명이 겹치지 않게 상대 경로를 쓴다
        img = load_image(p, args.max_side)
        a = analyze_image(img, cfg, seg, yolo, ov)
        res, notes, obstacle, strip_used = a["res"], a["notes"], a["obstacle"], a["strip"]
        model_sw, g = a["model_sw"], a["green"]
        note = ", ".join(notes)
        if res is None:
            rows.append({"photo": rel, "note": "보도 미검출"})
            print(f"[{i}/{len(files)}] {rel}: 보도 미검출")
            continue
        rows.append({"photo": rel, **res, "note": note})
        print(f"[{i}/{len(files)}] {rel}: {res['riskScore']} ({res['stage']}) {note}")
        if args.vis:
            free = ~obstacle
            if strip_used is not None:
                layers = [(strip_used & free, (60, 120, 255))]
            else:
                layers = [(model_sw & free, (0, 200, 0))]
                if g is not None:
                    layers.append(((g & ~model_sw) & free, (170, 0, 255)))
            save_vis(img, layers, obstacle, Path(args.vis) / (rel.rsplit(".", 1)[0].replace("/", "__") + "_vis.jpg"), f"risk {res['riskScore']}")

    with open(args.out, "w", newline="", encoding="utf-8-sig") as f:
        wr = csv.DictWriter(f, fieldnames=fields)
        wr.writeheader()
        wr.writerows(rows)
    print(f"저장: {args.out} ({len(rows)}장)")


if __name__ == "__main__":
    main()
