"""RoadPush 분석 API (FastAPI).

  POST /api/v1/analyze   사진 또는 영상 -> AnalysisApiResponse (docs/frontend-architecture.md)
  GET  /health           서버·모델 상태
  GET  /results/<파일>    결과 이미지 (withImage=true로 요청했을 때만 만든다)

실행: backend 폴더에서  uvicorn app.main:app --host 0.0.0.0 --port 8000
환경변수는 backend/README.md 참고.
"""
import io
import os
import sys
import tempfile
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageOps

HERE = Path(__file__).resolve().parent
AI_DIR = Path(os.environ.get("ROADPUSH_AI_DIR", HERE.parents[1] / "ai"))
sys.path.insert(0, str(AI_DIR))

from roadpush_engine import Engine, NoWalkwayError, video_frames  # noqa: E402
from roadpush_score import IMAGE_SUFFIXES  # noqa: E402

VIDEO_SUFFIXES = {".mp4", ".mov", ".avi", ".webm", ".mkv"}
MAX_IMAGE_BYTES = int(os.environ.get("ROADPUSH_MAX_IMAGE_MB", "25")) * 1024 * 1024
MAX_VIDEO_BYTES = int(os.environ.get("ROADPUSH_MAX_VIDEO_MB", "100")) * 1024 * 1024
RESULT_DIR = Path(os.environ.get("ROADPUSH_RESULT_DIR", tempfile.gettempdir())) / "roadpush_results"
RESULT_KEEP_SECONDS = 3600
RESULT_KEEP_FILES = 200
DEBUG = os.environ.get("ROADPUSH_DEBUG", "") == "1"

try:  # HEIC 사진
    from pillow_heif import register_heif_opener

    register_heif_opener()
except ImportError:
    pass


def _env_bool(name):
    v = os.environ.get(name)
    return None if v is None else v.lower() in ("1", "true", "yes")


@asynccontextmanager
async def lifespan(app):
    if getattr(app.state, "engine", None) is None:  # 테스트에서는 미리 넣어 둔다
        cfg = os.environ.get("ROADPUSH_CONFIG", str(AI_DIR / "config.json"))
        app.state.engine = Engine(cfg, use_owl=_env_bool("ROADPUSH_OWL"), yolo_weights=os.environ.get("ROADPUSH_YOLO"))
    RESULT_DIR.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(title="RoadPush Analysis API", version="0.1.0", lifespan=lifespan)
origins = [o.strip() for o in os.environ.get("ROADPUSH_CORS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST"], allow_headers=["*"])
RESULT_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/results", StaticFiles(directory=RESULT_DIR), name="results")


def _cleanup_results():
    files = sorted(RESULT_DIR.glob("*.jpg"), key=lambda p: p.stat().st_mtime)
    now = time.time()
    for i, p in enumerate(files):
        if now - p.stat().st_mtime > RESULT_KEEP_SECONDS or i < len(files) - RESULT_KEEP_FILES:
            p.unlink(missing_ok=True)


def _read_limited(upload, limit):
    data = upload.file.read(limit + 1)
    if len(data) > limit:
        raise HTTPException(413, f"파일이 너무 큽니다 (최대 {limit // 1024 // 1024}MB)")
    return data


def _open_image(data, max_side):
    try:
        img = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")
    except Exception:
        raise HTTPException(415, "이미지를 읽을 수 없습니다 (jpg, png, heic 지원)")
    img.thumbnail((max_side, max_side))
    return img


@app.get("/health")
def health():
    e = app.state.engine
    return {"status": "ok", "owl": e.ov is not None, "yolo": e.yolo is not None}


@app.post("/api/v1/analyze")
def analyze(
    request: Request,
    file: UploadFile = File(...),
    locationId: str | None = Form(None),
    withImage: bool = Form(False),
):
    """locationId는 프론트가 보내는 값이라 받기만 하고 쓰지 않는다 (구간 연결은 프론트가 한다).
    withImage=true면 결과 이미지를 만들어 resultImageUrl로 돌려준다. 기본은 빈 값이라 프론트가 overlay를 직접 그린다."""
    engine = app.state.engine
    max_side = engine.svc.get("max_side", 1280)
    suffix = Path(file.filename or "").suffix.lower()
    ctype = (file.content_type or "").lower()
    is_video = suffix in VIDEO_SUFFIXES or ctype.startswith("video/")
    if not (is_video or suffix in IMAGE_SUFFIXES or ctype.startswith("image/")):
        raise HTTPException(415, "이미지(jpg, png, heic) 또는 영상(mp4, mov 등)만 올릴 수 있습니다")

    if is_video:
        data = _read_limited(file, MAX_VIDEO_BYTES)
        with tempfile.NamedTemporaryFile(suffix=suffix or ".mp4", delete=False) as tmp:
            tmp.write(data)
        try:
            frames = video_frames(tmp.name, count=3)
        finally:
            os.unlink(tmp.name)
        if not frames:
            raise HTTPException(415, "영상에서 프레임을 읽을 수 없습니다")
        candidates = []
        for fr in frames:
            fr.thumbnail((max_side, max_side))
            candidates.append(fr)
    else:
        candidates = [_open_image(_read_limited(file, MAX_IMAGE_BYTES), max_side)]

    best = None  # 영상이면 프레임 중 가장 위험한 장면을 대표로 쓴다
    for img in candidates:
        a = engine.analyze(img)
        if a["res"] is None:
            continue
        if best is None or a["res"]["riskScore"] > best[1]["res"]["riskScore"]:
            best = (img, a)
    if best is None:
        raise HTTPException(422, "보행공간을 찾지 못했습니다. 보도가 보이도록 다시 촬영해 주세요")
    img, a = best

    try:
        out = engine.to_response(img, a, debug=DEBUG)
    except NoWalkwayError:
        raise HTTPException(422, "보행공간을 찾지 못했습니다. 보도가 보이도록 다시 촬영해 주세요")

    if withImage or out["overlay"] is None:  # overlay를 못 만든 경우에는 결과 이미지로 대신 보여준다
        name = f"{uuid.uuid4().hex}.jpg"
        engine.render(img, a, RESULT_DIR / name, out["riskScore"])
        base = os.environ.get("ROADPUSH_PUBLIC_URL") or str(request.base_url).rstrip("/")
        out["resultImageUrl"] = f"{base}/results/{name}"
        _cleanup_results()
    return out
