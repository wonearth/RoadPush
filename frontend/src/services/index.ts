/**
 * 서비스 구현체 선택 지점.
 * Firebase 환경변수가 있으면 Firebase 구현을, 없으면 개발용 mock 구현을 사용한다 (services/config.ts).
 * 아직 Firebase 구현이 없는 서비스는 mock 을 사용한다.
 *
 *   authService      → Firebase Authentication (services/auth/firebaseAuthService.ts)
 *   locationService  → Cloud Firestore
 *   storageService   → Firebase Storage
 *   analysisService  → FastAPI + Python AI inference (services/analysis/apiAnalysisService.ts)
 */
import { mockAnalysisService } from "./analysis/mockAnalysisService";
import { mockAuthService } from "./auth/mockAuthService";
import { mockLocationService } from "./locations/mockLocationService";
import { mockDb } from "./mock/mockDb";
import { mockStorageService } from "./storage/mockStorageService";
import type { AnalysisService, AuthService, LocationService, StorageService } from "./types";

export { DATA_SOURCE } from "./config";

export const authService: AuthService = mockAuthService;
export const locationService: LocationService = mockLocationService;
export const storageService: StorageService = mockStorageService;
export const analysisService: AnalysisService = mockAnalysisService;

/** 현재 mock 데이터를 사용 중인지 (UI 에 '개발용 데이터' 표시용) */
export const IS_MOCK_MODE = true;

/** 데모 중 변경된 mock 데이터를 초기 상태로 되돌린다. */
export function resetMockData() {
  mockDb.reset();
}

export type * from "./types";
