import type { AnalysisResult } from "./analysis";
import type { ActionType, CloseReason, LocationStatus, ObstacleType, RiskLevel } from "./risk";

/** 우선순위 이유가 되는 주변 시설 종류 */
export type FacilityKind =
  | "SUBWAY" // 지하철역
  | "CHILD" // 초등학교·유치원·어린이집 (어린이보호구역 가능성)
  | "HOSPITAL"; // 병원

export interface NearbyFacility {
  kind: FacilityKind;
  name: string;
  /** 구간 좌표에서의 거리(m) */
  meters: number;
}

/**
 * 분석된 보행구간. Firestore `locations` 컬렉션 문서에 대응한다.
 * 위험도·보행공간 수치는 해당 구간의 "가장 최근" 분석 결과를 반영한다.
 */
export interface Location {
  id: string;
  /** 관리번호 (예: RP-2026-0007). 등록 순서대로 부여 */
  code?: string;
  name: string;
  address: string;
  /** 생활권 구분 (예: 신촌, 이대, 대현동) */
  area: string;
  latitude: number;
  longitude: number;
  /** 보행공간 단절 위험도 0~100 */
  riskScore: number;
  riskLevel: RiskLevel;
  /** 유효 보행공간 비율 0~1 */
  walkableRatio: number;
  /** 공간 잠식률 0~1 */
  obstructionRatio: number;
  /** 차도 우회(이탈) 필요 여부 */
  roadDetourRequired: boolean;
  obstacleTypes: ObstacleType[];
  /** ISO 8601 */
  analyzedAt: string;
  /** 원본 이미지 URL (mock://scene/... 이면 개발용 일러스트로 렌더링) */
  beforeImage: string;
  /** AI 결과 이미지 URL (비어 있으면 원본 + overlay 로 렌더링) */
  resultImage: string;
  status: LocationStatus;
  /** status 가 CLOSED 일 때의 종료 사유 */
  closeReason?: CloseReason;
  plannedActions: ActionType[];
  /** 주변 시설 (카카오 장소 검색, 처음 볼 때 한 번 찾아 저장). 없으면 아직 찾지 않은 것 */
  nearbyFacilities?: NearbyFacility[];
  /** 예시 데이터 여부 — 실제 촬영·AI 분석 결과가 아닌 개발용/모의 데이터 */
  isSample?: boolean;
}

export interface CreateLocationInput {
  name: string;
  address: string;
  area?: string;
  latitude?: number;
  longitude?: number;
}

/** 조치 완료 후 재분석까지 마친 구간의 조치 전·후 결과 */
export interface Improvement {
  location: Location;
  before: AnalysisResult;
  after: AnalysisResult;
}

export interface LocationQuery {
  levels?: RiskLevel[];
  obstacleType?: ObstacleType;
  keyword?: string;
  sort?: "risk-desc" | "risk-asc" | "recent";
}

export interface DashboardSummary {
  totalCount: number;
  /** 위험등급이 '안전'이 아닌 구간 수 */
  disconnectedCount: number;
  /** '위험' 등급 구간 수 */
  highRiskCount: number;
  averageRiskScore: number;
  distribution: Record<RiskLevel, number>;
}
