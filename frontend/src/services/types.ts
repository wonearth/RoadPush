/**
 * 데이터 접근 계약(interface).
 * UI 는 이 interface 에만 의존하며, 구현체(mock / Firebase / FastAPI)는 services/index.ts 에서 교체한다.
 */
import type {
  ActionLog,
  AnalysisResult,
  CreateLocationInput,
  DashboardSummary,
  Improvement,
  Location,
  LocationQuery,
  NearbyFacility,
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
  /** 현재 비밀번호 확인 후 변경 */
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  /** 비밀번호 확인 후 계정과 프로필을 삭제 (회원 탈퇴) */
  deleteAccount(password: string): Promise<void>;
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
  /** 조치 완료 후 재분석까지 마친 구간을 위험도가 많이 줄어든 순으로 반환한다 */
  getImprovements(): Promise<Improvement[]>;
  /**
   * 같은 위치에서 새로 찍은 분석을 기존 구간에 추가한다.
   * 조치 완료·종료된 구간인데 다시 위험이 발견되면 신규 발견으로 다시 연다.
   */
  addRepeatAnalysis(locationId: string, analysis: AnalysisResult, actor: string): Promise<Location>;
  /** 주변 시설 검색 결과를 구간에 저장한다 (다음부터는 다시 찾지 않는다) */
  saveNearbyFacilities(locationId: string, facilities: NearbyFacility[]): Promise<void>;
  /** 관리번호가 없는 구간에 번호를 붙인다 (예시 구간 먼저, 분석 일시 순). 붙인 개수를 반환 */
  assignMissingCodes(): Promise<number>;
  /** 아직 없는 신촌·이대 예시 구간·이력을 넣는다. 넣은 문서 수를 반환 (실제 데이터만 쓰는 환경이면 0) */
  seedSampleData(): Promise<number>;
}

export interface AnalyzeInput {
  file: File | null;
  mediaType: MediaType;
  /** Storage 에 업로드된 원본(또는 대표 프레임) URL */
  originalImageUrl: string;
  originalVideoUrl?: string;
  /** 재분석일 경우 대상 구간 */
  locationId?: string;
  /** 재분석일 경우 비교 기준이 되는 최초 분석 결과 (mock 분석에서 조치 후 결과를 만들 때 사용) */
  baseline?: { riskScore: number; walkableRatio: number };
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
