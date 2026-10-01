# RoadPush Frontend (MVP)

Next.js 16 · TypeScript · Tailwind CSS v4

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 프로덕션 빌드 확인
```

현재는 **개발용 mock 인증 / mock 데이터 / mock AI 분석**으로 동작합니다.
연결 지점은 `src/services/index.ts` 한 곳에서 교체합니다. 자세한 내용은 루트의 `docs/frontend-architecture.md` 참고.

- 데모 계정 (mock): `admin@roadpush.dev` / `roadpush2026`
- 데모 중 변경된 데이터는 브라우저 localStorage 에 저장되며, 사이드바 하단 **데모 데이터 초기화**로 되돌릴 수 있습니다.
