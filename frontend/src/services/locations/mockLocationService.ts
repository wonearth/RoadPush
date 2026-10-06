/**
 * ⚠️ 개발용 MOCK 위험구간 서비스.
 * TODO(firebase): Firestore 구현으로 교체
 *   locations       → collection("locations")
 *   analysisResults → collection("analysisResults") where locationId == id orderBy analyzedAt
 *   actions         → collection("actions") where locationId == id orderBy createdAt
 */
import { createId } from "@/lib/id";
import { delay } from "@/lib/delay";
import type { LocationService } from "@/services/types";
import type { DashboardSummary, Location } from "@/types";
import { mockDb } from "../mock/mockDb";
import { applyAnalysisToLocation, applyLocationQuery, randomAreaCoordinate, summarizeLocations } from "./locationQuery";

export const mockLocationService: LocationService = {
  async list(query = {}) {
    await delay(200);
    return applyLocationQuery([...mockDb.read().locations], query);
  },

  async get(id) {
    await delay(150);
    return mockDb.read().locations.find((l) => l.id === id) ?? null;
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    await delay(200);
    return summarizeLocations(mockDb.read().locations);
  },

  async createFromAnalysis(input, analysis) {
    await delay(400);
    const id = createId("loc");
    const fallback = randomAreaCoordinate();
    const latitude = input.latitude ?? fallback.latitude;
    const longitude = input.longitude ?? fallback.longitude;
    const base: Location = {
      id,
      name: input.name.trim(),
      address: input.address.trim(),
      area: input.area?.trim() || "기타",
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
    const location = applyAnalysisToLocation(base, analysis);
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
      db.locations[idx] = applyAnalysisToLocation(db.locations[idx], analysis);
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

  async seedSampleData() {
    if (mockDb.read().locations.length) return 0;
    mockDb.reset();
    return mockDb.read().locations.length;
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

