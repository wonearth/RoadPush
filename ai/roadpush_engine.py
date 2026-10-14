"""API 서버용 분석 엔진: 사진 한 장 -> 프론트가 받는 응답 형식(AnalysisApiResponse).

점수 계산은 roadpush_score.analyze_image()를 그대로 쓴다 (CLI 평가와 같은 코드).
이 파일이 하는 일은 결과를 서비스 형식으로 바꾸는 것뿐이다.
  - 점수를 화면 단계 경계(25/50/75)에 맞게 보정
  - 장애물을 서비스 4개 유형(주정차 차량·공사시설·적치물·방치 자전거·PM)으로 분류
  - 보도·차도·남은 보행공간을 0~1 좌표 다각형으로 변환 (프론트가 사진 위에 그린다)
"""
import threading
from pathlib import Path

import cv2
import numpy as np

from roadpush_score import STAGES, Segmenter, OpenVocabDetector, analyze_image, load_config, save_vis, stage_of

OBSTACLE_CODE = {
    "주정차 차량": "ILLEGAL_PARKING",
    "공사시설": "CONSTRUCTION",
    "적치물": "STACKED_MATERIALS",
    "방치 자전거·PM": "ABANDONED_PM",
}
DEFAULT_TYPE = "적치물"


class NoWalkwayError(Exception):
    """보행공간(보도·가상 띠)을 찾지 못했을 때."""


def to_display_score(raw, raw_thresholds, display_thresholds=(25, 50, 75)):
    """평가에 쓴 단계 경계(예: 10/50/75)를 화면 경계(25/50/75)에 맞춰 점수를 늘이고 줄인다.

    단조 증가 변환이라 단계는 평가 때와 항상 같다. 경계가 같으면 점수를 그대로 쓴다.
    """
    if list(raw_thresholds) == list(display_thresholds):
        return round(float(raw), 1)
    rb = [0.0, *map(float, raw_thresholds), 100.0]
    db = [0.0, *map(float, display_thresholds), 100.0]
    for i in range(4):
        lo, hi = rb[i], rb[i + 1]
        if raw <= hi or i == 3:
            d_lo = db[i] + (1.0 if i > 0 else 0.0)  # 구간 시작은 이전 단계 끝 + 1 (26, 51, 76)
            d_hi = db[i + 1]
            t = 0.0 if hi == lo else min(1.0, max(0.0, (raw - lo) / (hi - lo)))
            return round(d_lo + t * (d_hi - d_lo), 1)
    return round(float(raw), 1)


def mask_polygons(mask, count=1, eps=0.01, max_side=320, min_area=0.005):
    """bool 마스크 -> 0~1 좌표 다각형 목록 (큰 덩어리 순). 작은 조각은 버린다."""
    h, w = mask.shape
    sc = min(1.0, max_side / max(h, w))
    sw, sh = max(1, int(w * sc)), max(1, int(h * sc))
    small = cv2.resize(mask.astype(np.uint8), (sw, sh), interpolation=cv2.INTER_NEAREST)
    cnts, _ = cv2.findContours(small, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    out = []
    for c in sorted(cnts, key=cv2.contourArea, reverse=True)[:count]:
        if cv2.contourArea(c) < min_area * sw * sh:
            continue
        pts = cv2.approxPolyDP(c, eps * cv2.arcLength(c, True), True).reshape(-1, 2)
        if len(pts) < 3:
            continue
        out.append([[round(float(x) / sw, 4), round(float(y) / sh, 4)] for x, y in pts])
    return out


class Engine:
    def __init__(self, cfg_path, use_owl=None, yolo_weights=None, seg=None, yolo=None, ov=None):
        """seg/yolo/ov를 직접 넣으면(테스트용) 모델을 내려받지 않는다."""
        self.cfg = load_config(cfg_path)
        self.svc = self.cfg["service"]
        self.seg = seg or Segmenter(self.cfg["seg_model"])
        weights = yolo_weights if yolo_weights is not None else self.cfg["yolo"].get("weights")
        self.yolo = yolo
        if self.yolo is None and weights:
            from ultralytics import YOLO

            self.yolo = YOLO(weights)
        if use_owl is None:
            use_owl = self.cfg.get("open_vocab", {}).get("enabled", False)
        self.ov = ov or (OpenVocabDetector(self.cfg["open_vocab"]) if use_owl else None)
        self.lock = threading.Lock()  # 모델은 한 번에 한 장씩만 돌린다

    # ---- 분류 ----
    def _type_of(self, part):
        key = str(part["key"])
        table = {"seg": "seg_obstacle_types", "yolo": "yolo_class_types", "owl": "owl_label_types"}[part["source"]]
        return self.svc[table].get(key, DEFAULT_TYPE)

    def _near(self, sidewalk, width):
        k = max(3, int(self.cfg.get("obstacle_near_ratio", self.cfg["dilate_ratio"]) * width))
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
        return cv2.dilate(sidewalk.astype(np.uint8), kernel) > 0

    # ---- 분석 ----
    def analyze(self, img):
        with self.lock:
            return analyze_image(img, self.cfg, self.seg, self.yolo, self.ov)

    def to_response(self, img, a, debug=False):
        """analyze() 결과를 AnalysisApiResponse(dict)로 바꾼다. 보행공간을 못 찾았으면 NoWalkwayError."""
        res = a["res"]
        if res is None:
            raise NoWalkwayError("보행공간을 찾지 못했습니다")
        h, w = a["cmap"].shape
        raw = res["riskScore"]
        raw_t = self.cfg["stage_thresholds"]
        disp_t = self.svc.get("display_thresholds", [25, 50, 75])
        score = to_display_score(raw, raw_t, disp_t)
        stage = stage_of(raw, raw_t)

        # 보행 공간 근처에 걸친 장애물만 유형·박스로 보여준다
        near = self._near(a["sidewalk"], w)
        min_px = self.svc.get("presence_min_ratio", 0.002) * h * w
        kept = []
        for part in a["parts"]:
            overlap = int((part["mask"] & near).sum())
            if overlap >= min_px:
                kept.append((overlap, part))
        kept.sort(key=lambda t: -t[0])
        kept = kept[: self.svc.get("max_detections", 12)]

        types, dets = [], []
        for i, (_ov, part) in enumerate(kept):
            label = self._type_of(part)
            if label not in types:
                types.append(label)
            x1, y1, x2, y2 = part["box"]
            x1, y1, x2, y2 = max(0, x1), max(0, y1), min(w, x2), min(h, y2)
            if x2 - x1 < 2 or y2 - y1 < 2:
                continue
            d = {
                "id": f"det-{i}",
                "type": OBSTACLE_CODE[label],
                "box": {"x": round(x1 / w, 4), "y": round(y1 / h, 4),
                        "width": round((x2 - x1) / w, 4), "height": round((y2 - y1) / h, 4)},
            }
            if part["score"] is not None:
                d["confidence"] = round(part["score"], 2)
            dets.append(d)

        oc = self.svc["overlay"]
        road_id = self.cfg.get("fallback", {}).get("road_id", 0)
        road = mask_polygons(a["cmap"] == road_id, 1, oc["epsilon"], oc["max_side"], oc["min_area_ratio"])
        side = mask_polygons(a["sidewalk"], 1, oc["epsilon"], oc["max_side"], oc["min_area_ratio"])
        walk = mask_polygons(a["sidewalk"] & ~a["obstacle"], oc.get("walkable_regions", 3),
                             oc["epsilon"], oc["max_side"], oc["min_area_ratio"] * 0.6)
        overlay = None
        if road and side:  # 프론트가 도로·보도 다각형을 반드시 필요로 한다
            overlay = {"roadRegion": road[0], "sidewalkRegion": side[0], "walkableRegions": walk, "detections": dets}

        out = {
            "riskScore": score,
            "riskLevel": STAGES[stage],
            "walkableRatio": res["walkableRatio"],
            "obstructionRatio": round(1.0 - res["walkableRatio"], 3),
            "roadDetourRequired": stage == 3,  # '위험' = 차도 우회 필요
            "obstacleTypes": types,
            "resultImageUrl": "",
            "overlay": overlay,
        }
        if debug:  # 내부 지표는 개발 중에만 내보낸다
            out["meta"] = {"rawScore": raw, "continuity": res["continuity"], "choke": res["choke"],
                           "disconnected": res["disconnected"], "notes": a["notes"]}
        return out

    def render(self, img, a, path, score):
        """CLI --vis와 같은 색으로 결과 이미지를 저장한다."""
        free = ~a["obstacle"]
        if a["strip"] is not None:
            layers = [(a["strip"] & free, (60, 120, 255))]
        else:
            layers = [(a["model_sw"] & free, (0, 200, 0))]
            if a["green"] is not None:
                layers.append(((a["green"] & ~a["model_sw"]) & free, (170, 0, 255)))
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        save_vis(img, layers, a["obstacle"], path, f"risk {score}")


def video_frames(path, count=3):
    """영상에서 일정 간격으로 프레임 몇 장을 PIL RGB로 꺼낸다."""
    from PIL import Image

    cap = cv2.VideoCapture(str(path))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total <= 0:
        cap.release()
        return []
    idxs = sorted({int(total * (k + 0.5) / count) for k in range(count)})
    frames = []
    for i in idxs:
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ok, bgr = cap.read()
        if ok:
            frames.append(Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)))
    cap.release()
    return frames
