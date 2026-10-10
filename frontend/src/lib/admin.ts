/** 행정 실무 표시 — 관리번호, 담당 부서, 처리기한 */
import { ACTION_META } from "@/constants/risk";
import type { Location, ObstacleType, RiskLevel } from "@/types";

const DAY = 24 * 60 * 60 * 1000;

/** 관리번호 (예: RP-2026-0007) */
export const formatCode = (year: number, seq: number) => `RP-${year}-${String(seq).padStart(4, "0")}`;

const seqOf = (code?: string) => Number(code?.match(/^RP-\d{4}-(\d+)$/)?.[1] ?? 0);

/** 기존 관리번호 다음 번호 */
export function nextCodes(existing: Pick<Location, "code">[], count: number, year = new Date().getFullYear()): string[] {
  const max = Math.max(0, ...existing.map((l) => seqOf(l.code)));
  return Array.from({ length: count }, (_, i) => formatCode(year, max + i + 1));
}

/** 주요 원인별 담당 부서 (구청 일반 직제 기준) */
export const DEPARTMENT: Record<ObstacleType, string> = {
  ILLEGAL_PARKING: "주차관리과",
  CONSTRUCTION: "도로과",
  STACKED_MATERIALS: "건설관리과",
  ABANDONED_PM: "교통행정과",
};

/**
 * 담당 부서 — 현재 장애물 기준. 조치 후 재분석으로 장애물이 사라진 구간은
 * 담당자가 기록한 조치 내용(예: 적치물 제거 → 건설관리과)으로 정한다.
 */
export function departmentOf(location: Pick<Location, "obstacleTypes" | "plannedActions">): string {
  const main = location.obstacleTypes[0] ?? (location.plannedActions[0] && ACTION_META[location.plannedActions[0]].resolves);
  return main ? DEPARTMENT[main] : "도로과";
}

/** 위험등급별 처리기한(일) — 최근 발견일 기준 */
export const DUE_DAYS: Partial<Record<RiskLevel, number>> = { DANGER: 3, WARNING: 7, CAUTION: 14 };

/** 화면 표시와 같은 로컬 날짜 기준 일 번호 */
const dayIndex = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY;

export interface DueInfo {
  due: Date;
  /** 남은 일수 (음수면 경과) */
  daysLeft: number;
  label: string;
  overdue: boolean;
}

/** 조치가 끝나지 않은 구간의 처리기한. 안전 등급이거나 조치 완료·종료면 null */
export function dueOf(
  location: Pick<Location, "riskLevel" | "status" | "analyzedAt">,
  now = new Date(),
): DueInfo | null {
  const days = DUE_DAYS[location.riskLevel];
  if (!days || (location.status !== "NEW" && location.status !== "ACTION_PLANNED")) return null;
  const due = new Date(new Date(location.analyzedAt).getTime() + days * DAY);
  // 시각이 아니라 날짜로 센다 (기한이 오늘이면 0 → "오늘까지")
  const daysLeft = dayIndex(due) - dayIndex(now);
  const label = daysLeft > 0 ? `D-${daysLeft}` : daysLeft === 0 ? "오늘까지" : `${-daysLeft}일 경과`;
  return { due, daysLeft, label, overdue: daysLeft < 0 };
}
