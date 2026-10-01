/**
 * 서비스 구현체 선택 지점.
 * 현재는 모두 개발용 mock 구현을 사용한다. 실제 연결 시 이 파일만 교체하면 된다.
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
