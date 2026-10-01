import type { ActionType, LocationStatus, ObstacleType, RiskLevel } from "@/types";

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
    text: "text-green-700",
    bg: "bg-green-600",
    softBg: "bg-green-50",
    border: "border-green-200",
    description: "보행공간이 충분히 이어짐",
  },
  CAUTION: {
    label: "주의",
    min: 26,
    max: 50,
    hex: "#eab308",
    badge: "bg-yellow-50 text-yellow-800 ring-yellow-600/25",
    text: "text-yellow-700",
    bg: "bg-yellow-500",
    softBg: "bg-yellow-50",
    border: "border-yellow-200",
    description: "보행공간 일부 잠식",
  },
  WARNING: {
    label: "경고",
    min: 51,
    max: 75,
    hex: "#ea580c",
    badge: "bg-orange-50 text-orange-700 ring-orange-600/20",
    text: "text-orange-600",
    bg: "bg-orange-600",
    softBg: "bg-orange-50",
    border: "border-orange-200",
    description: "통행이 어려움",
  },
  DANGER: {
    label: "위험",
    min: 76,
    max: 100,
    hex: "#dc2626",
    badge: "bg-red-50 text-red-700 ring-red-600/20",
    text: "text-red-600",
    bg: "bg-red-600",
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

export const STATUS_ORDER: LocationStatus[] = ["NEW", "REVIEW_REQUIRED", "ACTION_PLANNED", "RESOLVED"];

export const STATUS_META: Record<LocationStatus, { label: string; badge: string; dot: string }> = {
  NEW: { label: "신규 발견", badge: "bg-blue-50 text-blue-700 ring-blue-600/20", dot: "bg-blue-500" },
  REVIEW_REQUIRED: {
    label: "확인 필요",
    badge: "bg-rose-50 text-rose-700 ring-rose-600/20",
    dot: "bg-rose-500",
  },
  ACTION_PLANNED: {
    label: "조치 예정",
    badge: "bg-violet-50 text-violet-700 ring-violet-600/20",
    dot: "bg-violet-500",
  },
  RESOLVED: { label: "조치 완료", badge: "bg-slate-100 text-slate-700 ring-slate-500/20", dot: "bg-slate-400" },
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
