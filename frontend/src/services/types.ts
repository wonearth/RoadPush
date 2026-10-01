/**
 * 데이터 접근 계약(interface).
 * UI 는 이 interface 에만 의존하며, 구현체(mock / Firebase / FastAPI)는 services/index.ts 에서 교체한다.
 */
import type {
  ActionLog,
  AnalysisResult,
  CreateLocationInput,
  DashboardSummary,
  Location,
  LocationQuery,
  MediaType,
  SignUpInput,
  UpdateActionInput,
  User,
} from "@/types";

export interface AuthService {
  getCurrentUser(): Promise<User | null>;
  /** 인증 상태 변화를 구독한다. 반환값은 구독 해제 함수. (Firebase onAuthStateChanged 와 같은 형태) */
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
  signIn(email: string, password: string): Promise<User>;
  signUp(input: SignUpInput): Promise<User>;
  signOut(): Promise<void>;
}

export interface LocationService {
  list(query?: LocationQuery): Promise<Location[]>;
  get(id: string): Promise<Location | null>;
  getDashboardSummary(): Promise<DashboardSummary>;
  /** 분석 결과를 새 위험구간으로 등록한다. */
  createFromAnalysis(input: CreateLocationInput, analysis: AnalysisResult): Promise<Location>;
  /** 같은 구간의 재분석 결과를 기록하고 구간의 현재 위험도를 갱신한다. */
  addFollowUpAnalysis(locationId: string, analysis: AnalysisResult): Promise<Location>;
  getAnalysisHistory(locationId: string): Promise<AnalysisResult[]>;
  getActionLogs(locationId: string): Promise<ActionLog[]>;
  updateAction(locationId: string, input: UpdateActionInput, actor: string): Promise<Location>;
}

export interface AnalyzeInput {
  file: File | null;
  mediaType: MediaType;
  /** Storage 에 업로드된 원본(또는 대표 프레임) URL */
  originalImageUrl: string;
  originalVideoUrl?: string;
  /** 재분석일 경우 대상 구간 */
  locationId?: string;
}

export interface AnalysisService {
  analyze(input: AnalyzeInput): Promise<AnalysisResult>;
}

export interface UploadedMedia {
  mediaType: MediaType;
  /** 이미지 URL 또는 영상 대표 프레임 URL */
  imageUrl: string;
  videoUrl?: string;
}

export interface StorageService {
  uploadAnalysisMedia(file: File): Promise<UploadedMedia>;
}
