import type { AnalysisResult } from "@/types";

const DAY = 24 * 60 * 60 * 1000;
/** 상습 여부를 볼 기간 */
export const OCCURRENCE_WINDOW_DAYS = 28;
/** 기간 안에 이 횟수 이상 발견되면 상습으로 본다 */
const HABITUAL_COUNT = 3;

export type TimeSlot = "MORNING" | "DAY" | "EVENING" | "NIGHT";

export const TIME_SLOTS: { key: TimeSlot; label: string; range: string }[] = [
  { key: "MORNING", label: "아침", range: "06~11시" },
  { key: "DAY", label: "낮", range: "11~17시" },
  { key: "EVENING", label: "저녁", range: "17~22시" },
  { key: "NIGHT", label: "밤", range: "22~06시" },
];

/** 분석 시각을 한국 시간 기준 시간대로 나눈다 */
export function timeSlotOf(iso: string): TimeSlot {
  const hour = (new Date(iso).getUTCHours() + 9) % 24;
  if (hour >= 6 && hour < 11) return "MORNING";
  if (hour >= 11 && hour < 17) return "DAY";
  if (hour >= 17 && hour < 22) return "EVENING";
  return "NIGHT";
}

export interface OccurrenceSummary {
  /** 단절이 발견된(안전 아님) 분석 — 오래된 순 */
  occurrences: AnalysisResult[];
  /** 마지막 발견 시점 기준 최근 4주 동안의 발견 횟수 (시간이 지나도 숫자가 0이 되지 않게 마지막 발견 기준으로 센다) */
  recentCount: number;
  kind: "NONE" | "ONCE" | "REPEATED" | "HABITUAL";
  slotCounts: Record<TimeSlot, number>;
  /** 발견의 절반 이상이 몰린 시간대 (2회 이상일 때만) */
  mainSlot: TimeSlot | null;
}

/** 구간 분석 이력으로 발생 횟수·상습 여부·주 발생 시간대를 계산한다. */
export function summarizeOccurrences(history: AnalysisResult[]): OccurrenceSummary {
  const occurrences = history
    .filter((r) => r.riskLevel !== "SAFE")
    .sort((a, b) => a.analyzedAt.localeCompare(b.analyzedAt));
  const last = occurrences.at(-1);
  const since = last ? new Date(last.analyzedAt).getTime() - OCCURRENCE_WINDOW_DAYS * DAY : 0;
  const recent = occurrences.filter((r) => new Date(r.analyzedAt).getTime() > since);

  const slotCounts: Record<TimeSlot, number> = { MORNING: 0, DAY: 0, EVENING: 0, NIGHT: 0 };
  recent.forEach((r) => slotCounts[timeSlotOf(r.analyzedAt)]++);
  const top = TIME_SLOTS.map((s) => s.key).sort((a, b) => slotCounts[b] - slotCounts[a])[0];
  const mainSlot = recent.length >= 2 && slotCounts[top] * 2 >= recent.length ? top : null;

  const kind =
    recent.length === 0 ? "NONE" : recent.length === 1 ? "ONCE" : recent.length < HABITUAL_COUNT ? "REPEATED" : "HABITUAL";
  return { occurrences, recentCount: recent.length, kind, slotCounts, mainSlot };
}
