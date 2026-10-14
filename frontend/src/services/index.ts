/**
 * 서비스 구현체 선택 지점.
 *
 *   authService      → Firebase Authentication (services/auth/firebaseAuthService.ts)
 *   locationService  → Cloud Firestore (services/locations/firestoreLocationService.ts)
 *   storageService   → Firebase Storage (services/storage/firebaseStorageService.ts)
 *   analysisService  → NEXT_PUBLIC_API_BASE_URL 이 있으면 FastAPI AI 서버(apiAnalysisService), 없으면 mock 분석
 */
import { apiAnalysisService } from "./analysis/apiAnalysisService";
import { mockAnalysisService } from "./analysis/mockAnalysisService";
import { firebaseAuthService } from "./auth/firebaseAuthService";
import { firestoreLocationService } from "./locations/firestoreLocationService";
import { firebaseStorageService } from "./storage/firebaseStorageService";
import type { AnalysisService, AuthService, LocationService, StorageService } from "./types";

export const authService: AuthService = firebaseAuthService;
export const locationService: LocationService = firestoreLocationService;
export const storageService: StorageService = firebaseStorageService;
/** 실제 AI 서버에 연결돼 있는지. false 면 mock 분석이라 결과를 구간에 저장하면 안 된다. */
export const isLiveAnalysis = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);
export const analysisService: AnalysisService = isLiveAnalysis ? apiAnalysisService : mockAnalysisService;

export type * from "./types";
