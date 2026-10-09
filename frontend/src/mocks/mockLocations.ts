/**
 * ⚠️ 개발용 MOCK DATA — 실제 분석 결과가 아니다.
 * 서울 신촌·이화여자대학교 인근을 가정한 가상의 분석구간으로, UI 흐름 확인 목적으로만 사용한다.
 * 좌표·위험도·장애요인은 모두 임의로 작성된 값이다.
 */
import { getRiskLevel } from "@/constants/risk";
import type { ActionLog, AnalysisPhase, AnalysisResult, CloseReason, Location, LocationStatus, ObstacleType } from "@/types";
import type { ActionType } from "@/types";
import { generateMockOverlay } from "./mockOverlay";

interface MockMetrics {
  riskScore: number;
  walkableRatio: number;
  roadDetourRequired: boolean;
  obstacleTypes: ObstacleType[];
  analyzedAt: string;
}

interface MockSeed {
  id: string;
  name: string;
  address: string;
  area: string;
  latitude: number;
  longitude: number;
  status: LocationStatus;
  closeReason?: CloseReason;
  plannedActions: ActionType[];
  initial: MockMetrics;
  /** 조치 후 재분석이 이미 수행된 구간 */
  followUp?: MockMetrics;
  /** 같은 위치를 다시 찍어 또 발견된 기록 (상습 여부 예시) */
  repeats?: MockMetrics[];
}

const SEEDS: MockSeed[] = [
  {
    id: "sinchon-a",
    name: "신촌 A구간",
    address: "서울 서대문구 연세로 신촌역 3번 출구 앞 보도",
    area: "신촌",
    latitude: 37.5561,
    longitude: 126.9373,
    status: "NEW",
    plannedActions: [],
    initial: {
      riskScore: 82,
      walkableRatio: 0.31,
      roadDetourRequired: true,
      obstacleTypes: ["ILLEGAL_PARKING", "CONSTRUCTION"],
      analyzedAt: "2026-09-29T10:20:00+09:00",
    },
  },
  {
    id: "ewha-b",
    name: "이대 B구간",
    address: "서울 서대문구 이화여대길 이대역 2번 출구 인근",
    area: "이대",
    latitude: 37.5574,
    longitude: 126.9457,
    status: "ACTION_PLANNED",
    plannedActions: ["PM_RELOCATION"],
    initial: {
      riskScore: 67,
      walkableRatio: 0.44,
      roadDetourRequired: true,
      obstacleTypes: ["ABANDONED_PM"],
      analyzedAt: "2026-09-28T15:40:00+09:00",
    },
  },
  {
    id: "ewha-c",
    name: "이대 정문 C구간",
    address: "서울 서대문구 이화여대길 이화여대 정문 앞 보도",
    area: "이대",
    latitude: 37.5602,
    longitude: 126.9466,
    status: "RESOLVED",
    plannedActions: ["CONSTRUCTION_CLEANUP", "MATERIAL_REMOVAL"],
    initial: {
      riskScore: 74,
      walkableRatio: 0.38,
      roadDetourRequired: true,
      obstacleTypes: ["CONSTRUCTION", "STACKED_MATERIALS"],
      analyzedAt: "2026-09-18T09:10:00+09:00",
    },
    followUp: {
      riskScore: 22,
      walkableRatio: 0.81,
      roadDetourRequired: false,
      obstacleTypes: [],
      analyzedAt: "2026-09-26T14:00:00+09:00",
    },
  },
  {
    id: "sinchon-d",
    name: "신촌 D구간",
    address: "서울 서대문구 명물길 신촌 먹자골목 입구",
    area: "신촌",
    latitude: 37.5572,
    longitude: 126.9391,
    status: "NEW",
    plannedActions: [],
    initial: {
      riskScore: 79,
      walkableRatio: 0.27,
      roadDetourRequired: true,
      obstacleTypes: ["STACKED_MATERIALS", "ILLEGAL_PARKING"],
      analyzedAt: "2026-09-30T18:05:00+09:00",
    },
    // 저녁마다 반복되는 적치물·주정차 — 상습 발생 예시
    repeats: [
      { riskScore: 74, walkableRatio: 0.33, roadDetourRequired: true, obstacleTypes: ["STACKED_MATERIALS"], analyzedAt: "2026-10-01T19:20:00+09:00" },
      { riskScore: 81, walkableRatio: 0.25, roadDetourRequired: true, obstacleTypes: ["STACKED_MATERIALS", "ILLEGAL_PARKING"], analyzedAt: "2026-10-03T18:40:00+09:00" },
      { riskScore: 69, walkableRatio: 0.38, roadDetourRequired: true, obstacleTypes: ["STACKED_MATERIALS"], analyzedAt: "2026-10-05T20:10:00+09:00" },
      { riskScore: 77, walkableRatio: 0.29, roadDetourRequired: true, obstacleTypes: ["STACKED_MATERIALS", "ILLEGAL_PARKING"], analyzedAt: "2026-10-07T19:05:00+09:00" },
    ],
  },
  {
    id: "daehyeon-e",
    name: "대현동 E구간",
    address: "서울 서대문구 대현동 주택가 이면도로",
    area: "대현동",
    latitude: 37.5589,
    longitude: 126.9428,
    status: "NEW",
    plannedActions: [],
    initial: {
      riskScore: 58,
      walkableRatio: 0.49,
      roadDetourRequired: true,
      obstacleTypes: ["ILLEGAL_PARKING"],
      analyzedAt: "2026-09-27T11:30:00+09:00",
    },
    repeats: [
      { riskScore: 55, walkableRatio: 0.52, roadDetourRequired: true, obstacleTypes: ["ILLEGAL_PARKING"], analyzedAt: "2026-10-04T12:10:00+09:00" },
    ],
  },
  {
    id: "sinchon-f",
    name: "신촌 F구간",
    address: "서울 서대문구 신촌로 신촌역 2번 출구 버스정류장",
    area: "신촌",
    latitude: 37.5553,
    longitude: 126.9389,
    status: "NEW",
    plannedActions: [],
    initial: {
      riskScore: 41,
      walkableRatio: 0.63,
      roadDetourRequired: false,
      obstacleTypes: ["STACKED_MATERIALS"],
      analyzedAt: "2026-09-30T08:45:00+09:00",
    },
  },
  {
    id: "ewha-g",
    name: "이대 G구간",
    address: "서울 서대문구 이화여대5길 상점가",
    area: "이대",
    latitude: 37.5584,
    longitude: 126.9447,
    status: "NEW",
    plannedActions: [],
    initial: {
      riskScore: 88,
      walkableRatio: 0.19,
      roadDetourRequired: true,
      obstacleTypes: ["CONSTRUCTION", "STACKED_MATERIALS", "ABANDONED_PM"],
      analyzedAt: "2026-10-01T09:15:00+09:00",
    },
  },
  {
    id: "sinchon-h",
    name: "신촌 H구간",
    address: "서울 서대문구 연세로 차 없는 거리 중앙",
    area: "신촌",
    latitude: 37.5587,
    longitude: 126.9376,
    status: "NEW",
    plannedActions: [],
    initial: {
      riskScore: 16,
      walkableRatio: 0.88,
      roadDetourRequired: false,
      obstacleTypes: [],
      analyzedAt: "2026-09-25T16:20:00+09:00",
    },
  },
  {
    id: "ewha-i",
    name: "이대 I구간",
    address: "서울 서대문구 신촌로 이대역 4번 출구 앞",
    area: "이대",
    latitude: 37.5563,
    longitude: 126.9441,
    status: "NEW",
    plannedActions: [],
    initial: {
      riskScore: 34,
      walkableRatio: 0.6,
      roadDetourRequired: false,
      obstacleTypes: ["ABANDONED_PM"],
      analyzedAt: "2026-09-29T13:50:00+09:00",
    },
  },
  // ── 조치 완료 + 재분석까지 마친 구간 (대시보드 개선 효과 예시) ──
  {
    id: "sinchon-j",
    name: "신촌 J구간",
    address: "서울 서대문구 연세로 현대백화점 앞 보도",
    area: "신촌",
    latitude: 37.5565,
    longitude: 126.9358,
    status: "RESOLVED",
    plannedActions: ["PARKING_ENFORCEMENT"],
    initial: {
      riskScore: 81,
      walkableRatio: 0.27,
      roadDetourRequired: true,
      obstacleTypes: ["ILLEGAL_PARKING"],
      analyzedAt: "2026-09-15T18:40:00+09:00",
    },
    followUp: {
      riskScore: 18,
      walkableRatio: 0.86,
      roadDetourRequired: false,
      obstacleTypes: [],
      analyzedAt: "2026-09-22T18:30:00+09:00",
    },
  },
  {
    id: "daehyeon-k",
    name: "대현동 K구간",
    address: "서울 서대문구 신촌로 대현동 상가 앞 보도",
    area: "대현동",
    latitude: 37.5583,
    longitude: 126.9432,
    status: "RESOLVED",
    plannedActions: ["MATERIAL_REMOVAL"],
    initial: {
      riskScore: 63,
      walkableRatio: 0.46,
      roadDetourRequired: false,
      obstacleTypes: ["STACKED_MATERIALS"],
      analyzedAt: "2026-09-16T11:00:00+09:00",
    },
    followUp: {
      riskScore: 21,
      walkableRatio: 0.83,
      roadDetourRequired: false,
      obstacleTypes: [],
      analyzedAt: "2026-09-24T10:30:00+09:00",
    },
  },
  {
    id: "ewha-l",
    name: "이대 L구간",
    address: "서울 서대문구 이화여대길 이대 후문 방향 보도",
    area: "이대",
    latitude: 37.5619,
    longitude: 126.9441,
    status: "RESOLVED",
    plannedActions: ["PM_RELOCATION"],
    initial: {
      riskScore: 57,
      walkableRatio: 0.52,
      roadDetourRequired: false,
      obstacleTypes: ["ABANDONED_PM"],
      analyzedAt: "2026-09-20T08:50:00+09:00",
    },
    followUp: {
      riskScore: 27,
      walkableRatio: 0.76,
      roadDetourRequired: false,
      obstacleTypes: ["ABANDONED_PM"],
      analyzedAt: "2026-09-27T09:10:00+09:00",
    },
  },
  // ── 조치 없이 종료된 구간 (잘못 분석됨 예시) ──
  {
    id: "sinchon-m",
    name: "신촌 M구간",
    address: "서울 서대문구 명물길 신촌 먹자골목 입구",
    area: "신촌",
    latitude: 37.5578,
    longitude: 126.9368,
    status: "CLOSED",
    closeReason: "FALSE_POSITIVE",
    plannedActions: [],
    initial: {
      riskScore: 46,
      walkableRatio: 0.6,
      roadDetourRequired: false,
      obstacleTypes: ["STACKED_MATERIALS"],
      analyzedAt: "2026-09-27T20:10:00+09:00",
    },
  },
];

function toResult(seed: MockSeed, metrics: MockMetrics, phase: AnalysisPhase, index = 0): AnalysisResult {
  const suffix = phase === "INITIAL" ? "initial" : phase === "FOLLOW_UP" ? "followup" : `repeat-${index + 1}`;
  const obstructionRatio = Math.round((1 - metrics.walkableRatio) * 100) / 100;
  return {
    id: `mock-result-${seed.id}-${suffix}`,
    locationId: seed.id,
    phase,
    riskScore: metrics.riskScore,
    riskLevel: getRiskLevel(metrics.riskScore),
    walkableRatio: metrics.walkableRatio,
    obstructionRatio,
    roadDetourRequired: metrics.roadDetourRequired,
    obstacleTypes: metrics.obstacleTypes,
    mediaType: "image",
    originalImageUrl: `mock://scene/${seed.id}/${suffix}`,
    resultImageUrl: "",
    overlay: generateMockOverlay(metrics.obstacleTypes, obstructionRatio, `${seed.id}-${suffix}`),
    analyzedAt: metrics.analyzedAt,
    isMock: true,
  };
}

export const MOCK_ANALYSIS_RESULTS: AnalysisResult[] = SEEDS.flatMap((s) =>
  [
    toResult(s, s.initial, "INITIAL"),
    ...(s.repeats ?? []).map((m, i) => toResult(s, m, "REPEAT", i)),
    ...(s.followUp ? [toResult(s, s.followUp, "FOLLOW_UP")] : []),
  ].sort((a, b) => a.analyzedAt.localeCompare(b.analyzedAt)),
);

export const MOCK_LOCATIONS: Location[] = SEEDS.map((s) => {
  const latest = MOCK_ANALYSIS_RESULTS.filter((r) => r.locationId === s.id).at(-1)!;
  return {
    id: s.id,
    name: s.name,
    address: s.address,
    area: s.area,
    latitude: s.latitude,
    longitude: s.longitude,
    riskScore: latest.riskScore,
    riskLevel: latest.riskLevel,
    walkableRatio: latest.walkableRatio,
    obstructionRatio: latest.obstructionRatio,
    roadDetourRequired: latest.roadDetourRequired,
    obstacleTypes: latest.obstacleTypes,
    analyzedAt: latest.analyzedAt,
    beforeImage: latest.originalImageUrl,
    resultImage: latest.resultImageUrl,
    status: s.status,
    ...(s.closeReason && { closeReason: s.closeReason }),
    plannedActions: s.plannedActions,
    isSample: true,
  };
});

export const MOCK_ACTION_LOGS: ActionLog[] = [
  {
    id: "mock-action-ewha-b-1",
    locationId: "ewha-b",
    status: "ACTION_PLANNED",
    actionTypes: ["PM_RELOCATION"],
    memo: "PM 운영사에 방치 기기 이동 요청 (개발용 예시)",
    createdAt: "2026-09-29T09:00:00+09:00",
    createdBy: "데모 관리자",
  },
  {
    id: "mock-action-ewha-c-1",
    locationId: "ewha-c",
    status: "ACTION_PLANNED",
    actionTypes: ["CONSTRUCTION_CLEANUP", "MATERIAL_REMOVAL"],
    memo: "공사 가림막 보도 침범 구간 정비 요청 (개발용 예시)",
    createdAt: "2026-09-19T10:00:00+09:00",
    createdBy: "데모 관리자",
  },
  {
    id: "mock-action-ewha-c-2",
    locationId: "ewha-c",
    status: "RESOLVED",
    actionTypes: ["CONSTRUCTION_CLEANUP", "MATERIAL_REMOVAL"],
    memo: "가림막 재설치 및 자재 이동 완료 (개발용 예시)",
    createdAt: "2026-09-25T17:30:00+09:00",
    createdBy: "데모 관리자",
  },
  {
    id: "mock-action-sinchon-j-1",
    locationId: "sinchon-j",
    status: "RESOLVED",
    actionTypes: ["PARKING_ENFORCEMENT"],
    memo: "저녁 시간대 집중 단속 후 불법 주정차 해소 (개발용 예시)",
    createdAt: "2026-09-22T17:00:00+09:00",
    createdBy: "데모 관리자",
  },
  {
    id: "mock-action-daehyeon-k-1",
    locationId: "daehyeon-k",
    status: "RESOLVED",
    actionTypes: ["MATERIAL_REMOVAL"],
    memo: "상가 앞 적치물 자진 정리 안내 및 수거 완료 (개발용 예시)",
    createdAt: "2026-09-23T16:00:00+09:00",
    createdBy: "데모 관리자",
  },
  {
    id: "mock-action-ewha-l-1",
    locationId: "ewha-l",
    status: "RESOLVED",
    actionTypes: ["PM_RELOCATION"],
    memo: "PM 운영사에 방치 기기 이동 요청, 일부 기기 남음 (개발용 예시)",
    createdAt: "2026-09-26T15:00:00+09:00",
    createdBy: "데모 관리자",
  },
  {
    id: "mock-action-sinchon-m-1",
    locationId: "sinchon-m",
    status: "CLOSED",
    closeReason: "FALSE_POSITIVE",
    actionTypes: [],
    memo: "현장 확인 결과 영업 중 일시 적재로 확인, 상시 장애물 아님 (개발용 예시)",
    createdAt: "2026-09-28T11:00:00+09:00",
    createdBy: "데모 관리자",
  },
];
