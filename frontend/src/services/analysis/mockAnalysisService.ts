/**
 * ⚠️ 개발용 MOCK AI 분석 서비스 — 실제 모델 추론을 하지 않는다.
 * 미리 정해 둔 예시 결과를 지연 시간 후 반환한다.
 * TODO(fastapi): services/index.ts 에서 apiAnalysisService 로 교체
 */
import { RISK_LEVEL_FROM_LABEL, OBSTACLE_FROM_LABEL, getRiskLevel } from "@/constants/risk";
import { createId } from "@/lib/id";
import { delay } from "@/lib/delay";
import { isMockMediaUrl } from "@/lib/scene";
import { generateMockOverlay } from "@/mocks/mockOverlay";
import type { AnalysisService } from "@/services/types";
import type { AnalysisApiResponse, AnalysisResult } from "@/types";

/** 신규 분석 시 반환하는 예시 응답 (FastAPI 응답 계약과 동일한 형식) */
export const MOCK_ANALYSIS_RESPONSE: AnalysisApiResponse = {
  riskScore: 82,
  riskLevel: "위험",
  walkableRatio: 0.31,
  obstructionRatio: 0.69,
  roadDetourRequired: true,
  obstacleTypes: ["주정차 차량", "공사시설"],
  resultImageUrl: "",
};

/** 조치 후 재분석 예시: 최초 분석 대비 위험도와 잠식률이 크게 줄어든 결과를 만든다. */
function mockFollowUpResponse(baseline?: { riskScore: number; walkableRatio: number }): AnalysisApiResponse {
  const baseScore = baseline?.riskScore ?? 82;
  const baseWalkable = baseline?.walkableRatio ?? 0.31;
  const riskScore = Math.max(8, Math.round(baseScore * 0.34));
  const walkableRatio = Math.min(0.92, Math.round((baseWalkable + 0.45) * 100) / 100);
  return {
    riskScore,
    riskLevel: "",
    walkableRatio,
    obstructionRatio: Math.round((1 - walkableRatio) * 100) / 100,
    roadDetourRequired: false,
    obstacleTypes: [],
    resultImageUrl: "",
  };
}

/** API 응답(한글 라벨) → 도메인 모델 변환. FastAPI 구현에서도 재사용한다. */
export function toAnalysisResult(
  res: AnalysisApiResponse,
  meta: Pick<AnalysisResult, "mediaType" | "originalImageUrl" | "originalVideoUrl" | "locationId" | "phase">,
): AnalysisResult {
  const id = createId("analysis");
  const obstacleTypes = res.obstacleTypes.map((label) => OBSTACLE_FROM_LABEL[label]).filter(Boolean);
  return {
    id,
    ...meta,
    riskScore: res.riskScore,
    riskLevel: RISK_LEVEL_FROM_LABEL[res.riskLevel] ?? getRiskLevel(res.riskScore),
    walkableRatio: res.walkableRatio,
    obstructionRatio: res.obstructionRatio,
    roadDetourRequired: res.roadDetourRequired,
    obstacleTypes,
    resultImageUrl: res.resultImageUrl,
    overlay: res.overlay ?? null,
    analyzedAt: new Date().toISOString(),
  };
}

export const mockAnalysisService: AnalysisService = {
  async analyze(input) {
    await delay(2600);
    const isFollowUp = Boolean(input.locationId);
    const res = isFollowUp ? mockFollowUpResponse(input.baseline) : MOCK_ANALYSIS_RESPONSE;
    const result = toAnalysisResult(res, {
      mediaType: input.mediaType,
      originalImageUrl: input.originalImageUrl,
      originalVideoUrl: input.originalVideoUrl,
      locationId: input.locationId ?? null,
      phase: isFollowUp ? "FOLLOW_UP" : "INITIAL",
    });
    // mock 은 결과 이미지를 만들지 않으므로 화면 표시용 가상 overlay 를 붙인다.
    // 개발용 예시 장면(mock://)은 같은 seed 를 써서 원본 일러스트와 탐지 박스 위치를 맞춘다.
    const seed = isMockMediaUrl(input.originalImageUrl) ? input.originalImageUrl : result.id;
    result.overlay = generateMockOverlay(result.obstacleTypes, result.obstructionRatio, seed);
    result.isMock = true;
    return result;
  },
};
