/** 위험구간 목록 필터·정렬·요약 — mock / Firestore 구현이 함께 사용한다. */
import { RISK_LEVELS } from "@/constants/risk";
import type { AnalysisResult, DashboardSummary, Location, LocationQuery, RiskLevel } from "@/types";

export function applyLocationQuery(items: Location[], query: LocationQuery = {}): Location[] {
  const keyword = query.keyword?.trim().toLowerCase();
  const filtered = items
    .filter((l) => !query.levels?.length || query.levels.includes(l.riskLevel))
    .filter((l) => !query.obstacleType || l.obstacleTypes.includes(query.obstacleType))
    .filter((l) => !keyword || `${l.name} ${l.address} ${l.area}`.toLowerCase().includes(keyword));
  const sort = query.sort ?? "risk-desc";
  return filtered.sort((a, b) => {
    if (sort === "risk-asc") return a.riskScore - b.riskScore;
    if (sort === "recent") return b.analyzedAt.localeCompare(a.analyzedAt);
    return b.riskScore - a.riskScore;
  });
}

/** 대시보드 요약 — 조치 없이 종료된 구간(CLOSED)은 집계에서 뺀다. */
export function summarizeLocations(all: Location[]): DashboardSummary {
  const locations = all.filter((l) => l.status !== "CLOSED");
  const distribution = Object.fromEntries(RISK_LEVELS.map((lv) => [lv, 0])) as Record<RiskLevel, number>;
  locations.forEach((l) => distribution[l.riskLevel]++);
  const total = locations.length;
  return {
    totalCount: total,
    disconnectedCount: total - distribution.SAFE,
    highRiskCount: distribution.DANGER,
    averageRiskScore: total ? Math.round(locations.reduce((s, l) => s + l.riskScore, 0) / total) : 0,
    distribution,
  };
}

/** 분석 결과를 구간의 현재 상태(위험도·보행공간 등)에 반영한다. */
export function applyAnalysisToLocation(location: Location, analysis: AnalysisResult): Location {
  return {
    ...location,
    riskScore: analysis.riskScore,
    riskLevel: analysis.riskLevel,
    walkableRatio: analysis.walkableRatio,
    obstructionRatio: analysis.obstructionRatio,
    roadDetourRequired: analysis.roadDetourRequired,
    obstacleTypes: analysis.obstacleTypes,
    analyzedAt: analysis.analyzedAt,
    beforeImage: analysis.originalImageUrl,
    resultImage: analysis.resultImageUrl,
    isSample: Boolean(location.isSample || analysis.isMock),
  };
}

// 신촌·이대 생활권 범위 내 임의 좌표 (지도 API 연결 시 주소 → 좌표 geocoding 으로 대체)
const AREA_BOUNDS = { lat: [37.5552, 37.5598], lng: [126.9365, 126.9462] };

export function randomAreaCoordinate() {
  return {
    latitude: AREA_BOUNDS.lat[0] + Math.random() * (AREA_BOUNDS.lat[1] - AREA_BOUNDS.lat[0]),
    longitude: AREA_BOUNDS.lng[0] + Math.random() * (AREA_BOUNDS.lng[1] - AREA_BOUNDS.lng[0]),
  };
}
