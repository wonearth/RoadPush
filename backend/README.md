# backend — RoadPush 분석 API (FastAPI)

사진(또는 영상)을 받아 보행공간 단절 위험도를 돌려준다. 점수 계산은 `ai/roadpush_score.py`의 `analyze_image()`를
그대로 쓰므로, 평가(`roadpush_eval.py`)에 쓴 코드와 같다. `ai/roadpush_engine.py`가 결과를 프론트 응답 형식으로 바꾼다.

## API

| | |
|---|---|
| `POST /api/v1/analyze` | multipart: `file`(이미지 jpg·png·heic, 영상 mp4·mov 등), `locationId`(선택), `withImage`(선택, true면 결과 이미지 생성) |
| `GET /health` | 서버·모델 상태 |
| `GET /results/<파일>` | `withImage=true`로 만든 결과 이미지 (1시간 뒤 삭제) |

응답은 `docs/frontend-architecture.md`의 `AnalysisApiResponse`와 같다.
`riskScore`는 화면 단계(안전 0~25 / 주의 26~50 / 경고 51~75 / 위험 76~100)에 맞춰 보정한 값이고,
`overlay`에는 보도·차도·남은 보행공간 다각형과 장애물 박스가 0~1 좌표로 들어 있다.
영상은 3프레임을 뽑아 가장 위험한 장면을 대표로 쓴다. 보도를 못 찾으면 422와 안내 문구를 돌려준다.

## 실행

```bash
pip install -r requirements.txt
# 점수 가중치는 공개 저장소에 두지 않는다. 팀에게 받은 config.private.json 을 ai/ 에 넣거나, 아래 환경변수를 쓴다.
# export ROADPUSH_WEIGHTS="..,..,.."
uvicorn app.main:app --host 0.0.0.0 --port 8000        # backend 폴더에서
```

처음 실행하면 SegFormer, OWLv2 가중치를 내려받는다(몇 분). OWLv2는 CPU에서 사진 한 장에 수 초~수십 초 걸리니
시연에는 GPU(Colab T4 등)를 권장한다.

| 환경변수 | 기본값 | 설명 |
|---|---|---|
| `ROADPUSH_CORS` | `http://localhost:3000` | 프론트 주소(쉼표로 여러 개) |
| `ROADPUSH_OWL` | config의 `open_vocab.enabled` | `1`/`0`로 OWL 탐지 켜고 끄기 |
| `ROADPUSH_YOLO` | 없음 | YOLO 가중치 경로 |
| `ROADPUSH_CONFIG` | `ai/config.json` | 설정 파일 |
| `ROADPUSH_AI_DIR` | `../ai` | ai 코드 폴더 (Colab처럼 폴더 구조가 다를 때) |
| `ROADPUSH_PUBLIC_URL` | 요청 주소 | 결과 이미지 URL의 앞부분 (프록시·터널 뒤에서) |
| `ROADPUSH_DEBUG` | 꺼짐 | `1`이면 응답에 내부 지표(`meta`)를 넣는다. 외부에 열어 둔 서버에서는 켜지 않는다 |
| `ROADPUSH_MAX_IMAGE_MB` / `_VIDEO_MB` | 25 / 100 | 업로드 크기 제한 |

## 프론트 연결

`frontend/.env.local`에 `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`을 넣고 `npm run dev`를 다시 시작한다.
값이 없으면 지금처럼 mock 분석으로 동작한다. (`frontend/src/services/index.ts`)

## 테스트

```bash
pip install pytest httpx
python -m pytest tests -q      # 모델 없이 가짜 분할 결과로 실행, 10개
```

## 운영 시 주의

- **업로드된 사진은 저장하지 않는다.** 결과 이미지(`withImage=true`)만 임시 폴더에 두고 1시간 뒤 지운다. 사진에 얼굴·번호판이 있을 수 있다.
- 서버를 인터넷에 열면 누구나 호출할 수 있다. 시연 때만 켜고, 인증이 필요하면 앞단(프록시)에서 건다.
- 이 서버는 사진 한 장씩 순서대로 처리한다(모델 잠금). 동시에 여러 명이 쓰면 줄을 선다.
