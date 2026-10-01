# Frontend 구조 및 연동 지점

## 레이어

```
pages (app/)  →  components  →  hooks (useAuth, useAsync)  →  services (interface)  →  mock | firebase | fastapi
```

UI 는 `src/services/types.ts` 의 interface 에만 의존한다. 구현체 선택은 `src/services/index.ts` 한 곳.

| 서비스 | 현재 (mock) | 연결 예정 |
| --- | --- | --- |
| `authService` | `services/auth/mockAuthService.ts` (localStorage 세션) | Firebase Authentication + Firestore `users` |
| `locationService` | `services/locations/mockLocationService.ts` (`mockDb`) | Firestore `locations`, `analysisResults`, `actions` |
| `storageService` | `services/storage/mockStorageService.ts` (브라우저 미리보기) | Firebase Storage |
| `analysisService` | `services/analysis/mockAnalysisService.ts` (고정 예시 결과) | FastAPI `POST /api/v1/analyze` → `apiAnalysisService.ts` |
| 지도 | `components/map/MockRiskMap.tsx` (SVG) | Kakao/Naver Map — `components/map/RiskMap.tsx` 에서 교체 |

## FastAPI 응답 계약 (`AnalysisApiResponse`)

```json
{
  "riskScore": 82,
  "riskLevel": "위험",
  "walkableRatio": 0.31,
  "obstructionRatio": 0.69,
  "roadDetourRequired": true,
  "obstacleTypes": ["주정차 차량", "공사시설"],
  "resultImageUrl": "",
  "overlay": null
}
```

`overlay`(선택)는 결과 이미지를 프론트에서 그릴 때 사용: `roadRegion`, `sidewalkRegion`, `walkableRegions`, `detections[{type, box}]` — 모두 0~1 정규화 좌표.
`resultImageUrl` 이 있으면 그 이미지를 그대로 표시하고, 없으면 원본 위에 overlay 를 그린다.

## 위험도 기준 (단일 출처: `src/constants/risk.ts`)

| 등급 | 점수 | 색 |
| --- | --- | --- |
| 안전 | 0~25 | Green |
| 주의 | 26~50 | Yellow |
| 경고 | 51~75 | Orange |
| 위험 | 76~100 | Red |

## Mock 데이터

`src/mocks/` — 모든 파일 상단에 개발용 표시. 실제 분석 결과가 아님.
- `mockLocations.ts` 신촌·이대 가상 9개 구간 + 분석 이력 + 조치 이력
- `mockUsers.ts` 데모 계정
- `mockOverlay.ts` 화면 표시용 가상 segmentation / bbox 생성기
