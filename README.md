# RoadPush — 보행자를 '차도로 밀어내는 길' AI 자동탐지

> "무엇이 놓여 있는가가 아니라, 보행자가 계속 걸을 수 있는 공간이 남아 있는가?"

2026 AI 라이프 아이디어 챌린지 출품 프로토타입.

```
RoadPush/
├── frontend/   Next.js 웹 MVP (현재 mock 데이터로 동작)
├── backend/    FastAPI (예정)
├── ai/         보도·차도 segmentation, 장애물 탐지, 위험도 산출 (예정)
├── data/       학습·검증 데이터 (예정)
└── docs/       설계 문서
```

## 실행

```bash
cd frontend
npm install
npm run dev
```

http://localhost:3000 접속
