# RoadPush Frontend

Next.js 16 · TypeScript · Tailwind CSS v4 · Firebase (Authentication, Firestore) · Kakao Map

```bash
cp .env.example .env.local   # Firebase · 카카오맵 키 입력
npm install
npm run dev                  # http://localhost:3000
```

- 관리자 화면은 회원가입 후 로그인해야 사용할 수 있습니다.
- 데이터가 비어 있으면 대시보드에서 신촌·이대 예시 데이터를 불러올 수 있습니다. (화면에 '예시 데이터'로 표시)
- AI 분석은 FastAPI 연결 전까지 예시 결과(mock)를 반환합니다.
