/**
 * ⚠️ 개발용 MOCK 위험구간 서비스.
 * TODO(firebase): Firestore 구현으로 교체
 *   locations       → collection("locations")
 *   analysisResults → collection("analysisResults") where locationId == id orderBy analyzedAt
 *   actions         → collection("actions") where locationId == id orderBy createdAt
 */
import { RISK_LEVELS } from "@/constants/risk";
import { createId } from "@/lib/id";
import { delay } from "@/lib/delay";
import type { LocationService } from "@/services/types";
import type { AnalysisResult, DashboardSummary, Location, RiskLevel } from "@/types";
import { mockDb } from "../mock/mockDb";

// 신촌·이대 생활권 범위 내 임의 좌표 (지도 API 연결 시 주소 → 좌표 geocoding 으로 대체)
const MOCK_BOUNDS = { lat: [37.5552, 37.5598], lng: [126.9365, 126.9462] };

function applyAnalysis(location: Location, analysis: AnalysisResult): Location {
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

export const mockLocationService: LocationService = {
  async list(query = {}) {
    await delay(200);
    const keyword = query.keyword?.trim().toLowerCase();
    const items = mockDb
      .read()
      .locations.filter((l) => !query.levels?.length || query.levels.includes(l.riskLevel))
      .filter((l) => !query.obstacleType || l.obstacleTypes.includes(query.obstacleType))
      .filter(
        (l) =>
          !keyword ||
          l.name.toLowerCase().includes(keyword) ||
          l.address.toLowerCase().includes(keyword) ||
          l.area.toLowerCase().includes(keyword),
      );
    const sort = query.sort ?? "risk-desc";
    return [...items].sort((a, b) => {
      if (sort === "risk-asc") return a.riskScore - b.riskScore;
      if (sort === "recent") return b.analyzedAt.localeCompare(a.analyzedAt);
      return b.riskScore - a.riskScore;
    });
  },

  async get(id) {
    await delay(150);
    return mockDb.read().locations.find((l) => l.id === id) ?? null;
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    await delay(200);
    const locations = mockDb.read().locations;
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
  },

  async createFromAnalysis(input, analysis) {
    await delay(400);
    const id = createId("loc");
    const latitude = input.latitude ?? MOCK_BOUNDS.lat[0] + Math.random() * (MOCK_BOUNDS.lat[1] - MOCK_BOUNDS.lat[0]);
    const longitude =
      input.longitude ?? MOCK_BOUNDS.lng[0] + Math.random() * (MOCK_BOUNDS.lng[1] - MOCK_BOUNDS.lng[0]);
    const base: Location = {
      id,
      name: input.name.trim(),
      address: input.address.trim(),
      area: input.area?.trim() || "신촌·이대",
      latitude,
      longitude,
      status: "NEW",
      plannedActions: [],
      riskScore: 0,
      riskLevel: "SAFE",
      walkableRatio: 1,
      obstructionRatio: 0,
      roadDetourRequired: false,
      obstacleTypes: [],
      analyzedAt: analysis.analyzedAt,
      beforeImage: "",
      resultImage: "",
    };
    const location = applyAnalysis(base, analysis);
    mockDb.write((db) => {
      db.locations.push(location);
      db.analysisResults.push({ ...analysis, locationId: id, phase: "INITIAL" });
    });
    return location;
  },

  async addFollowUpAnalysis(locationId, analysis) {
    await delay(300);
    return mockDb.write((db) => {
      const idx = db.locations.findIndex((l) => l.id === locationId);
      if (idx < 0) throw new Error("구간을 찾을 수 없습니다.");
      db.analysisResults.push({ ...analysis, locationId, phase: "FOLLOW_UP" });
      db.locations[idx] = applyAnalysis(db.locations[idx], analysis);
      return db.locations[idx];
    });
  },

  async getAnalysisHistory(locationId) {
    await delay(150);
    return mockDb
      .read()
      .analysisResults.filter((r) => r.locationId === locationId)
      .sort((a, b) => a.analyzedAt.localeCompare(b.analyzedAt));
  },

  async getActionLogs(locationId) {
    await delay(150);
    return mockDb
      .read()
      .actions.filter((a) => a.locationId === locationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async updateAction(locationId, input, actor) {
    await delay(350);
    return mockDb.write((db) => {
      const idx = db.locations.findIndex((l) => l.id === locationId);
      if (idx < 0) throw new Error("구간을 찾을 수 없습니다.");
      db.locations[idx] = { ...db.locations[idx], status: input.status, plannedActions: input.actionTypes };
      db.actions.push({
        id: createId("action"),
        locationId,
        status: input.status,
        actionTypes: input.actionTypes,
        memo: input.memo.trim(),
        createdAt: new Date().toISOString(),
        createdBy: actor,
      });
      return db.locations[idx];
    });
  },
};

