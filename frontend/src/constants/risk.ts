import type { ActionType, CloseReason, LocationStatus, NearbyFacility, ObstacleType, RiskLevel } from "@/types";

/**
 * 위험도 단계 기준과 색상의 단일 출처(single source of truth).
 * 모든 페이지는 이 파일의 값만 사용해 위험등급을 표현한다.
 */
export const RISK_LEVELS: RiskLevel[] = ["SAFE", "CAUTION", "WARNING", "DANGER"];

interface RiskLevelMeta {
  label: string;
  min: number;
  max: number;
  /** SVG·지도 marker 등 직접 색상이 필요한 곳 */
  hex: string;
  /** Tailwind 클래스 묶음 */
  badge: string;
  text: string;
  bg: string;
  softBg: string;
  border: string;
  description: string;
}

export const RISK_META: Record<RiskLevel, RiskLevelMeta> = {
  SAFE: {
    label: "안전",
    min: 0,
    max: 25,
    hex: "#16a34a",
    badge: "bg-green-50 text-green-700 ring-green-600/20",
    text: "text-[#16a34a]",
    bg: "bg-green-600",
    softBg: "bg-green-50",
    border: "border-green-200",
    description: "보행공간이 충분히 이어짐",
  },
  CAUTION: {
    label: "주의",
    min: 26,
    max: 50,
    hex: "#c58a00",
    badge: "bg-yellow-50 text-yellow-800 ring-yellow-600/25",
    text: "text-[#c58a00]",
    bg: "bg-[#c58a00]",
    softBg: "bg-yellow-50",
    border: "border-yellow-200",
    description: "보행공간 일부 잠식",
  },
  WARNING: {
    label: "경고",
    min: 51,
    max: 75,
    hex: "#e25e0b",
    badge: "bg-orange-50 text-orange-700 ring-orange-600/20",
    text: "text-[#e25e0b]",
    bg: "bg-[#e25e0b]",
    softBg: "bg-orange-50",
    border: "border-orange-200",
    description: "통행이 어려움",
  },
  DANGER: {
    label: "위험",
    min: 76,
    max: 100,
    hex: "#d92d20",
    badge: "bg-red-50 text-red-700 ring-red-600/20",
    text: "text-[#d92d20]",
    bg: "bg-[#d92d20]",
    softBg: "bg-red-50",
    border: "border-red-200",
    description: "차도로 우회해야 함",
  },
};

export function getRiskLevel(score: number): RiskLevel {
  if (score >= RISK_META.DANGER.min) return "DANGER";
  if (score >= RISK_META.WARNING.min) return "WARNING";
  if (score >= RISK_META.CAUTION.min) return "CAUTION";
  return "SAFE";
}

export const RISK_LEVEL_FROM_LABEL: Record<string, RiskLevel> = {
  안전: "SAFE",
  주의: "CAUTION",
  경고: "WARNING",
  위험: "DANGER",
};

/** 조치 흐름 순서 — 종료(CLOSED)는 흐름 밖에서 따로 고른다 */
export const STATUS_ORDER: LocationStatus[] = ["NEW", "ACTION_PLANNED", "RESOLVED"];
/** 필터 등에 쓰는 전체 상태 목록 */
export const ALL_STATUSES: LocationStatus[] = [...STATUS_ORDER, "CLOSED"];

export const STATUS_META: Record<LocationStatus, { label: string; badge: string; dot: string; desc: string }> = {
  NEW: { label: "신규 발견", badge: "bg-slate-100 text-slate-700", dot: "bg-blue-500", desc: "담당자 확인 전" },
  ACTION_PLANNED: {
    label: "조치 예정",
    badge: "bg-slate-100 text-slate-700",
    dot: "bg-violet-500",
    desc: "현장조치 예정",
  },
  RESOLVED: { label: "조치 완료", badge: "bg-slate-100 text-slate-500", dot: "bg-slate-400", desc: "현장조치 완료" },
  CLOSED: { label: "종료", badge: "bg-slate-100 text-slate-400", dot: "bg-slate-300", desc: "조치 없이 종료" },
};

/** 조치가 아직 끝나지 않은(점검 대상) 상태인지 */
export const isOpenStatus = (s: LocationStatus) => s === "NEW" || s === "ACTION_PLANNED";

/** 저장된 상태값을 현재 상태 체계로 맞춘다 (예전 "확인 필요"는 신규 발견으로 본다). */
export function normalizeStatus(s: string): LocationStatus {
  return (ALL_STATUSES as string[]).includes(s) ? (s as LocationStatus) : "NEW";
}

export const CLOSE_REASONS: CloseReason[] = ["FALSE_POSITIVE", "NOT_NEEDED", "DUPLICATE"];

export const CLOSE_REASON_META: Record<CloseReason, { label: string; desc: string }> = {
  FALSE_POSITIVE: { label: "잘못 분석됨", desc: "장애물 오탐지" },
  NOT_NEEDED: { label: "조치 불필요", desc: "현장 확인 결과 이상 없음" },
  DUPLICATE: { label: "중복 구간", desc: "기존 구간과 같은 장소" },
};

export const OBSTACLE_TYPES: ObstacleType[] = [
  "ILLEGAL_PARKING",
  "CONSTRUCTION",
  "STACKED_MATERIALS",
  "ABANDONED_PM",
];

export const OBSTACLE_META: Record<ObstacleType, { label: string; hex: string }> = {
  ILLEGAL_PARKING: { label: "주정차 차량", hex: "#e11d48" },
  CONSTRUCTION: { label: "공사시설", hex: "#d97706" },
  STACKED_MATERIALS: { label: "적치물", hex: "#2563eb" },
  ABANDONED_PM: { label: "방치 자전거·PM", hex: "#7c3aed" },
};

export const OBSTACLE_FROM_LABEL: Record<string, ObstacleType> = Object.fromEntries(
  OBSTACLE_TYPES.map((t) => [OBSTACLE_META[t].label, t]),
) as Record<string, ObstacleType>;

export const ACTION_TYPES: ActionType[] = [
  "PARKING_ENFORCEMENT",
  "CONSTRUCTION_CLEANUP",
  "MATERIAL_REMOVAL",
  "PM_RELOCATION",
];

export const ACTION_META: Record<ActionType, { label: string; resolves: ObstacleType }> = {
  PARKING_ENFORCEMENT: { label: "주정차 관리", resolves: "ILLEGAL_PARKING" },
  CONSTRUCTION_CLEANUP: { label: "공사구간 정비", resolves: "CONSTRUCTION" },
  MATERIAL_REMOVAL: { label: "적치물 제거", resolves: "STACKED_MATERIALS" },
  PM_RELOCATION: { label: "방치 PM 이동", resolves: "ABANDONED_PM" },
};

/** 탐지된 장애요인에 맞는 권장 조치 */
export function getRecommendedActions(obstacles: ObstacleType[]): ActionType[] {
  return ACTION_TYPES.filter((a) => obstacles.includes(ACTION_META[a].resolves));
}

/**
 * 통행 판단 — 담당자가 바로 이해할 수 있는 한 줄 표현.
 * 현장 판정표의 3단계(통행 원활 / 일부 잠식 / 차도 우회 필요)와 같은 기준을 쓴다.
 */
export type Passability = "CLEAR" | "NARROW" | "DETOUR";

export const PASSABILITY_META: Record<Passability, { label: string; detail: string }> = {
  CLEAR: { label: "통행 원활", detail: "보행공간이 끊기지 않고 이어집니다" },
  NARROW: { label: "일부 잠식", detail: "보행 유효폭이 좁아져 휠체어·유모차 통행이 불편합니다" },
  DETOUR: { label: "차도 우회 필요", detail: "보행 경로가 끊겨 차도로 내려가야 하며, 휠체어·유모차는 통과할 수 없습니다" },
};

export function getPassability(input: { riskScore: number; roadDetourRequired: boolean }): Passability {
  if (input.roadDetourRequired) return "DETOUR";
  return input.riskScore <= RISK_META.SAFE.max ? "CLEAR" : "NARROW";
}

/** 태그에 쓰는 짧은 시설명 — "이대역 2호선" → "이대역", "서울창천초등학교" → "서울창천초" */
const shortFacilityName = (name: string) =>
  name
    .replace(/\s+\S*선$/, "")
    .replace(/\s*초등학교$/, "초")
    .replace(/^.*\s(\S+초)$/, "$1");

/** 주변 시설 → 우선순위 이유 태그 문구 */
export function facilityTag(f: NearbyFacility): string {
  const name = shortFacilityName(f.name);
  if (f.kind === "SUBWAY") return `${name} ${f.meters}m`;
  if (f.kind === "CHILD") return `어린이보호구역 인접 가능 · ${name} ${f.meters}m`;
  return `의료시설 인접 · ${name} ${f.meters}m`;
}
