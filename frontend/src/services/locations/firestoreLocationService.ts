/**
 * Cloud Firestore 기반 위험구간 서비스.
 *
 *   locations/{id}        구간의 현재 상태 (최근 분석 결과 반영)
 *   analysisResults/{id}  분석 이력 (locationId 로 연결, 최초 분석 + 재분석)
 *   actions/{id}          현장조치 이력 (locationId 로 연결)
 *
 * MVP 규모(수십~수백 구간)에서는 목록을 한 번에 읽고 필터·정렬은 클라이언트에서 처리한다.
 */
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { normalizeStatus } from "@/constants/risk";
import { firestore } from "@/lib/firebase";
import { MOCK_ACTION_LOGS, MOCK_ANALYSIS_RESULTS, MOCK_LOCATIONS } from "@/mocks/mockLocations";
import type { LocationService } from "@/services/types";
import type { ActionLog, Location } from "@/types";
import { fromStoredAnalysis, toStoredAnalysis, type StoredAnalysisResult } from "./firestoreMappers";
import { applyAnalysisToLocation, applyLocationQuery, randomAreaCoordinate, summarizeLocations } from "./locationQuery";

const locationsCol = () => collection(firestore(), "locations");
const resultsCol = () => collection(firestore(), "analysisResults");
const actionsCol = () => collection(firestore(), "actions");

/** 저장된 문서를 Location 으로 바꾼다. 예전 상태값("확인 필요")도 현재 체계로 맞춘다. */
function toLocation(id: string, data: DocumentData): Location {
  return { id, ...(data as Omit<Location, "id">), status: normalizeStatus(data.status) };
}

async function fetchAll(): Promise<Location[]> {
  const snap = await getDocs(locationsCol());
  return snap.docs.map((d) => toLocation(d.id, d.data()));
}

async function fetchLocation(id: string): Promise<Location> {
  const snap = await getDoc(doc(locationsCol(), id));
  if (!snap.exists()) throw new Error("구간을 찾을 수 없습니다.");
  return toLocation(snap.id, snap.data());
}

const withoutId = <T extends { id: string }>({ id: _id, ...rest }: T) => (void _id, rest);

export const firestoreLocationService: LocationService = {
  async list(q) {
    return applyLocationQuery(await fetchAll(), q);
  },

  async get(id) {
    const snap = await getDoc(doc(locationsCol(), id));
    return snap.exists() ? toLocation(snap.id, snap.data()) : null;
  },

  async getDashboardSummary() {
    return summarizeLocations(await fetchAll());
  },

  async createFromAnalysis(input, analysis) {
    const locationRef = doc(locationsCol());
    const resultRef = doc(resultsCol());
    const fallback = randomAreaCoordinate();
    const location = applyAnalysisToLocation(
      {
        id: locationRef.id,
        name: input.name.trim(),
        address: input.address.trim(),
        area: input.area?.trim() || "기타",
        latitude: input.latitude ?? fallback.latitude,
        longitude: input.longitude ?? fallback.longitude,
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
      },
      analysis,
    );
    const batch = writeBatch(firestore());
    batch.set(locationRef, withoutId(location));
    batch.set(resultRef, toStoredAnalysis({ ...analysis, locationId: locationRef.id, phase: "INITIAL" }));
    await batch.commit();
    return location;
  },

  async addFollowUpAnalysis(locationId, analysis) {
    const updated = applyAnalysisToLocation(await fetchLocation(locationId), analysis);
    const batch = writeBatch(firestore());
    batch.set(doc(resultsCol()), toStoredAnalysis({ ...analysis, locationId, phase: "FOLLOW_UP" }));
    batch.set(doc(locationsCol(), locationId), withoutId(updated));
    await batch.commit();
    return updated;
  },

  async addRepeatAnalysis(locationId, analysis, actor) {
    const current = await fetchLocation(locationId);
    const reopen = (current.status === "RESOLVED" || current.status === "CLOSED") && analysis.riskLevel !== "SAFE";
    const next = applyAnalysisToLocation(current, analysis);
    // 다시 열 때는 종료 사유를 지운다 (Firestore 는 undefined 필드를 저장하지 못하므로 키 자체를 뺀다)
    const { closeReason: _closeReason, ...reopened } = next;
    void _closeReason;
    const updated: Location = reopen ? { ...reopened, status: "NEW" } : next;
    const batch = writeBatch(firestore());
    batch.set(doc(resultsCol()), toStoredAnalysis({ ...analysis, locationId, phase: "REPEAT" }));
    batch.set(doc(locationsCol(), locationId), withoutId(updated));
    if (reopen) {
      const log: Omit<ActionLog, "id"> = {
        locationId,
        status: "NEW",
        actionTypes: [],
        memo: "같은 위치에서 다시 발견되어 신규 발견으로 다시 열었어요",
        createdAt: new Date().toISOString(),
        createdBy: actor,
      };
      batch.set(doc(actionsCol()), log);
    }
    await batch.commit();
    return updated;
  },

  async saveNearbyFacilities(locationId, facilities) {
    await updateDoc(doc(locationsCol(), locationId), { nearbyFacilities: facilities });
  },

  async getAnalysisHistory(locationId) {
    // 단일 조건 쿼리 + 클라이언트 정렬 (복합 색인 불필요)
    const snap = await getDocs(query(resultsCol(), where("locationId", "==", locationId)));
    return snap.docs
      .map((d) => fromStoredAnalysis(d.id, d.data() as StoredAnalysisResult))
      .sort((a, b) => a.analyzedAt.localeCompare(b.analyzedAt));
  },

  async getImprovements() {
    const resolved = (await fetchAll()).filter((l) => l.status === "RESOLVED");
    if (!resolved.length) return [];
    // 단일 조건 쿼리만 쓴다 (복합 색인 불필요). in 조건은 최대 30개까지라 나눠서 읽는다.
    const ids = resolved.map((l) => l.id);
    const chunks = Array.from({ length: Math.ceil(ids.length / 30) }, (_, i) => ids.slice(i * 30, i * 30 + 30));
    const snaps = await Promise.all(chunks.map((c) => getDocs(query(resultsCol(), where("locationId", "in", c)))));
    const results = snaps
      .flatMap((snap) => snap.docs.map((d) => fromStoredAnalysis(d.id, d.data() as StoredAnalysisResult)))
      .sort((a, b) => a.analyzedAt.localeCompare(b.analyzedAt));
    return resolved
      .flatMap((location) => {
        const own = results.filter((r) => r.locationId === location.id);
        const before = own.find((r) => r.phase === "INITIAL");
        const after = own.filter((r) => r.phase === "FOLLOW_UP").at(-1);
        return before && after ? [{ location, before, after }] : [];
      })
      .sort((a, b) => b.before.riskScore - b.after.riskScore - (a.before.riskScore - a.after.riskScore));
  },

  async getActionLogs(locationId) {
    const snap = await getDocs(query(actionsCol(), where("locationId", "==", locationId)));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<ActionLog, "id">), status: normalizeStatus(d.data().status) }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async updateAction(locationId, input, actor) {
    const updated: Location = {
      ...(await fetchLocation(locationId)),
      status: input.status,
      closeReason: input.closeReason,
      plannedActions: input.actionTypes,
    };
    // Firestore 는 undefined 필드를 저장하지 못하므로 종료 사유는 있을 때만 넣는다
    const reason = input.closeReason ? { closeReason: input.closeReason } : {};
    const log: Omit<ActionLog, "id"> = {
      locationId,
      status: input.status,
      ...reason,
      actionTypes: input.actionTypes,
      memo: input.memo.trim(),
      createdAt: new Date().toISOString(),
      createdBy: actor,
    };
    const batch = writeBatch(firestore());
    batch.update(doc(locationsCol(), locationId), {
      status: updated.status,
      closeReason: input.closeReason ?? deleteField(),
      plannedActions: updated.plannedActions,
    });
    batch.set(doc(actionsCol()), log);
    await batch.commit();
    return updated;
  },

  async seedSampleData() {
    // 아직 없는 예시 구간·이력만 추가한다 (이미 있는 구간은 담당자가 바꾼 상태를 그대로 둔다).
    // 실제 데이터만 있고 예시 데이터를 쓰지 않는 환경이면 건드리지 않는다.
    const existing = await fetchAll();
    if (existing.length && !existing.some((l) => l.isSample)) return 0;
    const byId = new Map(existing.map((l) => [l.id, l]));
    const missing = new Set(MOCK_LOCATIONS.filter((l) => !byId.has(l.id)).map((l) => l.id));

    // 이미 있는 예시 구간에 나중에 추가된 반복 발견 기록
    const repeatCandidates = MOCK_ANALYSIS_RESULTS.filter(
      (r) => r.phase === "REPEAT" && r.locationId && byId.get(r.locationId)?.isSample,
    );
    const repeatExists = await Promise.all(repeatCandidates.map((r) => getDoc(doc(resultsCol(), r.id))));
    const newRepeats = repeatCandidates.filter((_, i) => !repeatExists[i].exists());
    if (!missing.size && !newRepeats.length) return 0;

    const batch = writeBatch(firestore());
    MOCK_LOCATIONS.filter((l) => missing.has(l.id)).forEach((l) => batch.set(doc(locationsCol(), l.id), withoutId(l)));
    MOCK_ANALYSIS_RESULTS.filter((r) => r.locationId && missing.has(r.locationId)).forEach((r) =>
      batch.set(doc(resultsCol(), r.id), toStoredAnalysis(r)),
    );
    MOCK_ACTION_LOGS.filter((a) => missing.has(a.locationId)).forEach((a) => batch.set(doc(actionsCol(), a.id), withoutId(a)));
    newRepeats.forEach((r) => batch.set(doc(resultsCol(), r.id), toStoredAnalysis(r)));
    // 구간의 현재 수치를 가장 최근 예시 분석으로 맞춘다 (그 뒤에 실제 분석이 추가됐다면 그대로 둔다)
    new Set(newRepeats.map((r) => r.locationId!)).forEach((id) => {
      const sample = MOCK_LOCATIONS.find((l) => l.id === id)!;
      if (byId.get(id)!.analyzedAt >= sample.analyzedAt) return;
      const { riskScore, riskLevel, walkableRatio, obstructionRatio, roadDetourRequired, obstacleTypes, analyzedAt, beforeImage, resultImage } =
        sample;
      batch.update(doc(locationsCol(), id), {
        riskScore,
        riskLevel,
        walkableRatio,
        obstructionRatio,
        roadDetourRequired,
        obstacleTypes,
        analyzedAt,
        beforeImage,
        resultImage,
      });
    });
    await batch.commit();
    return missing.size + newRepeats.length;
  },

};
