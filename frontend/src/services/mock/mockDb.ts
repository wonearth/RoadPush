/**
 * ⚠️ 개발용 MOCK 저장소.
 * Firestore 대신 브라우저 localStorage 에 seed 데이터를 복사해 두고 읽고 쓴다.
 * (등록·조치·재분석 결과가 새로고침 후에도 유지되도록)
 */
import { MOCK_ACTION_LOGS, MOCK_ANALYSIS_RESULTS, MOCK_LOCATIONS } from "@/mocks/mockLocations";
import { MOCK_USERS, type MockUserRecord } from "@/mocks/mockUsers";
import type { ActionLog, AnalysisResult, Location } from "@/types";

const STORAGE_KEY = "roadpush.mockdb.v1";

export interface MockDbState {
  users: MockUserRecord[];
  locations: Location[];
  analysisResults: AnalysisResult[];
  actions: ActionLog[];
}

function seed(): MockDbState {
  return structuredClone({
    users: MOCK_USERS,
    locations: MOCK_LOCATIONS,
    analysisResults: MOCK_ANALYSIS_RESULTS,
    actions: MOCK_ACTION_LOGS,
  });
}

let cache: MockDbState | null = null;

function load(): MockDbState {
  if (cache) return cache;
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as MockDbState) : seed();
  } catch {
    cache = seed();
  }
  return cache;
}

function persist() {
  if (typeof window === "undefined" || !cache) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // 용량 초과 등은 무시하고 메모리 상태만 유지한다.
  }
}

export const mockDb = {
  read(): MockDbState {
    return load();
  },
  write<T>(mutate: (state: MockDbState) => T): T {
    const state = load();
    const result = mutate(state);
    persist();
    return result;
  },
  reset() {
    cache = seed();
    persist();
  },
};
