/**
 * 서비스 구현체 선택 지점.
 *
 *   authService      → Firebase Authentication (services/auth/firebaseAuthService.ts)
 *   locationService  → Cloud Firestore (services/locations/firestoreLocationService.ts)
 *   storageService   → Firebase Storage (services/storage/firebaseStorageService.ts)
 *   analysisService  → (임시) mock 분석 — TODO: FastAPI + Python AI inference (services/analysis/apiAnalysisService.ts)
 */
import { mockAnalysisService } from "./analysis/mockAnalysisService";
import { firebaseAuthService } from "./auth/firebaseAuthService";
import { firestoreLocationService } from "./locations/firestoreLocationService";
import { firebaseStorageService } from "./storage/firebaseStorageService";
import type { AnalysisService, AuthService, LocationService, StorageService } from "./types";

export const authService: AuthService = firebaseAuthService;
export const locationService: LocationService = firestoreLocationService;
export const storageService: StorageService = firebaseStorageService;
export const analysisService: AnalysisService = mockAnalysisService;

export type * from "./types";
