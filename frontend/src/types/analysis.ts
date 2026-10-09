import type { ObstacleType, RiskLevel } from "./risk";

/** 0~1 로 정규화된 좌표 ([x, y]) */
export type NormalizedPoint = [number, number];
export type NormalizedPolygon = NormalizedPoint[];

export interface NormalizedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 장애물 탐지 결과 (bounding box) */
export interface Detection {
  id: string;
  type: ObstacleType;
  box: NormalizedBox;
  confidence?: number;
}

/**
 * AI 결과를 원본 위에 겹쳐 그리기 위한 기하 정보.
 * - roadRegion / sidewalkRegion: 보도·차도 segmentation
 * - walkableRegions: 실제 남아 있는 유효 보행공간 (없으면 보도 영역 - 장애물로 계산해 표시)
 */
export interface AnalysisOverlay {
  roadRegion: NormalizedPolygon;
  sidewalkRegion: NormalizedPolygon;
  walkableRegions?: NormalizedPolygon[];
  detections: Detection[];
}

export type MediaType = "image" | "video";
/** INITIAL 최초 분석 · FOLLOW_UP 조치 후 재분석 · REPEAT 같은 위치에서 다시 찍은 분석 */
export type AnalysisPhase = "INITIAL" | "FOLLOW_UP" | "REPEAT";

/**
 * 1회 분석 결과. Firestore `analysisResults` 컬렉션 문서에 대응한다.
 */
export interface AnalysisResult {
  id: string;
  locationId: string | null;
  phase: AnalysisPhase;
  riskScore: number;
  riskLevel: RiskLevel;
  walkableRatio: number;
  obstructionRatio: number;
  roadDetourRequired: boolean;
  obstacleTypes: ObstacleType[];
  mediaType: MediaType;
  /** 원본 이미지(또는 영상 대표 프레임) URL */
  originalImageUrl: string;
  /** 원본 영상 URL (영상 분석 시) */
  originalVideoUrl?: string;
  /** AI 가 생성한 결과 이미지 URL. 비어 있으면 overlay 로 그린다. */
  resultImageUrl: string;
  overlay: AnalysisOverlay | null;
  analyzedAt: string;
  /** mock AI 서비스가 만든 모의 결과 (실제 모델 추론 아님) */
  isMock?: boolean;
}

/**
 * FastAPI 분석 엔드포인트 응답 계약 (예정).
 * 백엔드 연결 시 이 형식을 받아 AnalysisResult 로 변환한다.
 */
export interface AnalysisApiResponse {
  riskScore: number;
  /** "안전" | "주의" | "경고" | "위험" */
  riskLevel: string;
  walkableRatio: number;
  obstructionRatio: number;
  roadDetourRequired: boolean;
  /** "주정차 차량" | "공사시설" | "적치물" | "방치 자전거·PM" */
  obstacleTypes: string[];
  resultImageUrl: string;
  overlay?: AnalysisOverlay | null;
}
