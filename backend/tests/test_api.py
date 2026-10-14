"""모델 없이 돌리는 테스트. SegFormer·OWL 자리에 가짜 모델을 넣어 변환·형식·오류 처리를 확인한다.

실행: backend 폴더에서  python -m pytest tests -q
"""
import io
import sys
from pathlib import Path

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "ai"))
sys.path.insert(0, str(ROOT / "backend"))

import roadpush_score as rs  # noqa: E402
from roadpush_engine import Engine, to_display_score  # noqa: E402
from app import main as appmod  # noqa: E402

CFG = str(ROOT / "ai" / "config.json")
H, W = 480, 640


def scene(obstacle_box=None, sidewalk=True):
    """도로(0) 위쪽, 보도(1) 아래쪽, 건물(2) 왼쪽 위. 장애물 박스는 자동차(13)로 채운다."""
    c = np.zeros((H, W), np.uint8)
    c[: int(H * 0.35)] = 2
    if sidewalk:
        c[int(H * 0.45):, int(W * 0.1): int(W * 0.9)] = 1
    if obstacle_box:
        x1, y1, x2, y2 = obstacle_box
        c[y1:y2, x1:x2] = 13
    return c


class FakeSeg:
    def __init__(self, cmap):
        self.cmap = cmap

    def predict(self, img):
        return cv2.resize(self.cmap, img.size, interpolation=cv2.INTER_NEAREST)


class FakeOwl:
    def __init__(self, dets):
        self.dets = dets

    def detect(self, img, shape):
        return self.dets


def jpeg_bytes(w=W, h=H):
    buf = io.BytesIO()
    Image.new("RGB", (w, h), (120, 120, 120)).save(buf, "JPEG")
    return buf.getvalue()


def client(cmap, owl=None):
    appmod.app.state.engine = Engine(CFG, use_owl=False, seg=FakeSeg(cmap), ov=owl)
    return TestClient(appmod.app)


def post(c, data, name="a.jpg", ctype="image/jpeg", **form):
    return c.post("/api/v1/analyze", files={"file": (name, data, ctype)}, data=form)


# 프론트 getRiskLevel()과 같은 규칙
def front_level(score):
    return "위험" if score >= 76 else "경고" if score >= 51 else "주의" if score >= 26 else "안전"


def test_response_shape_clear_path():
    with client(scene()) as c:
        r = post(c, jpeg_bytes())
    assert r.status_code == 200, r.text
    j = r.json()
    assert {"riskScore", "riskLevel", "walkableRatio", "obstructionRatio", "roadDetourRequired",
            "obstacleTypes", "resultImageUrl", "overlay"} <= set(j)
    assert j["riskScore"] <= 25 and j["riskLevel"] == "안전" and j["roadDetourRequired"] is False
    assert j["obstacleTypes"] == [] and j["resultImageUrl"] == ""
    ov = j["overlay"]
    for poly in [ov["roadRegion"], ov["sidewalkRegion"], *ov["walkableRegions"]]:
        assert len(poly) >= 3 and all(0 <= x <= 1 and 0 <= y <= 1 for x, y in poly)
    assert "meta" not in j  # 내부 지표는 기본으로 숨긴다


def test_blocked_path_detected_and_typed():
    # 보도 폭 전체를 가로막는 자동차. 분할 모델이 가려진 부분을 보도가 아닌 차로 읽어 보도에 구멍이 나는 경우라서
    # obstacle_near_ratio를 키웠을 때(구멍을 원래 길로 이어 붙임) 막힘으로 읽힌다.
    box = (int(W * 0.05), int(H * 0.60), int(W * 0.95), int(H * 0.75))
    appmod.app.state.engine = Engine(CFG, use_owl=False, seg=FakeSeg(scene(box)))
    appmod.app.state.engine.cfg["obstacle_near_ratio"] = 0.15
    with TestClient(appmod.app) as c:
        j = post(c, jpeg_bytes()).json()
    assert j["riskLevel"] in ("경고", "위험") and front_level(j["riskScore"]) == j["riskLevel"]
    assert j["obstacleTypes"] == ["주정차 차량"]
    d = j["overlay"]["detections"][0]
    assert d["type"] == "ILLEGAL_PARKING" and all(0 <= d["box"][k] <= 1 for k in ("x", "y", "width", "height"))


def test_owl_detection_maps_to_service_type():
    owl = FakeOwl([{"label": "clothing rack", "score": 0.6, "box": (int(W * 0.1), int(H * 0.55), int(W * 0.9), int(H * 0.9))}])
    with client(scene(), owl) as c:
        j = post(c, jpeg_bytes()).json()
    assert j["obstacleTypes"] == ["적치물"]
    assert j["overlay"]["detections"][0]["type"] == "STACKED_MATERIALS"
    assert j["overlay"]["detections"][0]["confidence"] == 0.6
    assert j["riskScore"] > 25


def test_label_matches_front_rule_for_every_raw_score():
    cfg = rs.load_config(CFG)
    raw_t = cfg["stage_thresholds"]
    prev = -1
    for raw10 in range(0, 1001):
        raw = raw10 / 10
        d = to_display_score(raw, raw_t)
        assert d >= prev  # 단조 증가
        prev = d
        assert front_level(d) == rs.STAGES[rs.stage_of(raw, raw_t)], (raw, d)


def test_cli_and_api_share_same_numbers():
    """analyze_image 결과의 원점수와 API 응답이 같은 단계를 가리킨다 (CLI 평가와 같은 코드 경로)."""
    cfg = rs.load_config(CFG)
    cm = scene((int(W * 0.05), int(H * 0.60), int(W * 0.5), int(H * 0.80)))
    img = Image.new("RGB", (W, H), (120, 120, 120))
    a = rs.analyze_image(img, cfg, FakeSeg(cm))
    with client(cm) as c:
        j = post(c, jpeg_bytes()).json()
    assert j["walkableRatio"] == a["res"]["walkableRatio"]
    assert j["riskLevel"] == a["res"]["stage"]


def test_no_walkway_returns_422():
    cm = np.full((H, W), 2, np.uint8)  # 건물 벽뿐, 도로도 보도도 없음 (도로만 있으면 가상 띠로 대신 분석한다)
    with client(cm) as c:
        r = post(c, jpeg_bytes())
    assert r.status_code == 422 and "보행공간" in r.json()["detail"]


def test_bad_inputs():
    with client(scene()) as c:
        assert post(c, b"hello", "a.txt", "text/plain").status_code == 415
        assert post(c, b"not an image", "a.jpg", "image/jpeg").status_code == 415
        old = appmod.MAX_IMAGE_BYTES
        appmod.MAX_IMAGE_BYTES = 100
        try:
            assert post(c, jpeg_bytes()).status_code == 413
        finally:
            appmod.MAX_IMAGE_BYTES = old


def test_with_image_serves_result():
    with client(scene()) as c:
        j = post(c, jpeg_bytes(), withImage="true", locationId="loc-1").json()
        url = j["resultImageUrl"]
        assert url.endswith(".jpg") and "/results/" in url
        g = c.get(url.replace("http://testserver", ""))
        assert g.status_code == 200 and g.headers["content-type"] == "image/jpeg"


def test_video_uses_riskiest_frame(tmp_path):
    p = tmp_path / "v.avi"
    vw = cv2.VideoWriter(str(p), cv2.VideoWriter_fourcc(*"MJPG"), 5, (W, H))
    for _ in range(15):
        vw.write(np.full((H, W, 3), 120, np.uint8))
    vw.release()
    with client(scene()) as c:
        r = post(c, p.read_bytes(), "v.avi", "video/x-msvideo")
    assert r.status_code == 200 and r.json()["riskLevel"] == "안전"


def test_health_and_cors():
    with client(scene()) as c:
        assert c.get("/health").json()["status"] == "ok"
        r = c.options("/api/v1/analyze", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST"})
        assert r.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_image_url_downloads_from_allowed_host(monkeypatch):
    monkeypatch.setattr(appmod, "_fetch_bytes", lambda url: jpeg_bytes())
    ok = "https://firebasestorage.googleapis.com/v0/b/x/o/a.jpg?alt=media&token=t"
    with client(scene()) as c:
        r = c.post("/api/v1/analyze", data={"imageUrl": ok})
    assert r.status_code == 200 and r.json()["riskLevel"] == "안전"


def test_image_url_rejects_other_hosts_and_http(monkeypatch):
    called = []
    monkeypatch.setattr(appmod, "_fetch_bytes", lambda url: called.append(url) or jpeg_bytes())
    with client(scene()) as c:
        for bad in ["https://evil.example.com/a.jpg", "http://firebasestorage.googleapis.com/a.jpg",
                    "https://169.254.169.254/latest/meta-data", "file:///etc/passwd",
                    "https://firebasestorage.googleapis.com.evil.com/a.jpg"]:
            assert c.post("/api/v1/analyze", data={"imageUrl": bad}).status_code == 400, bad
    assert called == []  # 허용되지 않은 주소로는 요청 자체를 보내지 않는다


def test_file_and_url_both_or_neither_is_400():
    with client(scene()) as c:
        assert c.post("/api/v1/analyze", data={}).status_code == 400
        r = c.post("/api/v1/analyze", files={"file": ("a.jpg", jpeg_bytes(), "image/jpeg")},
                   data={"imageUrl": "https://firebasestorage.googleapis.com/a.jpg"})
        assert r.status_code == 400


def test_image_url_download_failure_is_502(monkeypatch):
    def boom(url):
        raise OSError("down")
    monkeypatch.setattr(appmod, "_fetch_bytes", boom)
    with client(scene()) as c:
        r = c.post("/api/v1/analyze", data={"imageUrl": "https://firebasestorage.googleapis.com/a.jpg"})
    assert r.status_code == 502
