import { RISK_META } from "@/constants/risk";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { OCCURRENCE_WINDOW_DAYS, TIME_SLOTS, summarizeOccurrences, timeSlotOf } from "@/lib/occurrence";
import type { AnalysisPhase, AnalysisResult } from "@/types";
import { Card, CardBody, CardHeader } from "../ui/Card";

const PHASE_LABEL: Record<AnalysisPhase, string> = {
  INITIAL: "최초 발견",
  REPEAT: "다시 발견",
  FOLLOW_UP: "조치 후 재분석",
};

const KIND_META = {
  HABITUAL: { label: "상습 발생", badge: "border-[#d92d20] text-[#d92d20]" },
  REPEATED: { label: "반복 발생", badge: "border-[#c58a00] text-[#c58a00]" },
  ONCE: { label: "1회 발견", badge: "border-slate-300 text-slate-500" },
  NONE: { label: "최근 발견 없음", badge: "border-slate-300 text-slate-500" },
} as const;

/** 구간 상세 '발생 이력' — 일시적인 문제인지 상습적인 문제인지 보여준다. */
export function OccurrenceHistory({ history }: { history: AnalysisResult[] }) {
  const summary = summarizeOccurrences(history);
  const { kind, recentCount, slotCounts, mainSlot } = summary;
  const slot = TIME_SLOTS.find((s) => s.key === mainSlot);
  const maxSlot = Math.max(1, ...Object.values(slotCounts));

  const sentence =
    kind === "HABITUAL" || kind === "REPEATED"
      ? `최근 ${OCCURRENCE_WINDOW_DAYS / 7}주간 ${recentCount}회 발견${slot ? `, 주로 ${slot.label}(${slot.range}) 발생` : ""}`
      : kind === "ONCE"
        ? "1회 발견. 같은 위치를 다시 분석하면 상습 여부를 판단합니다."
        : "단절 발견 기록 없음";

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            발생 이력
            <span className={cn("rounded border px-1.5 py-px text-sm font-semibold", KIND_META[kind].badge)}>{KIND_META[kind].label}</span>
          </span>
        }
      />
      <CardBody className="grid gap-6 pt-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <p className="text-base text-slate-800">{sentence}</p>
          {kind === "HABITUAL" && (
            <p className="mt-1 text-sm text-slate-500">일회성 조치보다 정기 단속·시설 개선 검토를 권장합니다.</p>
          )}
          <div className="mt-5 grid grid-cols-4 gap-2">
            {TIME_SLOTS.map((s) => (
              <div key={s.key} className="text-center">
                <div className="flex h-20 items-end justify-center rounded-xl bg-slate-50 px-3 pb-2">
                  <span
                    className={cn("w-full rounded-md", s.key === mainSlot ? "bg-brand-500" : "bg-slate-300")}
                    style={{ height: `${(slotCounts[s.key] / maxSlot) * 100}%`, minHeight: slotCounts[s.key] ? 6 : 0 }}
                  />
                </div>
                <p className={cn("mt-1.5 text-sm font-semibold", s.key === mainSlot ? "text-brand-700" : "text-slate-700")}>
                  {s.label} <span className="tabular">{slotCounts[s.key]}</span>
                </p>
                <p className="text-xs text-slate-400">{s.range}</p>
              </div>
            ))}
          </div>
        </div>

        <ol className="space-y-2 lg:col-span-2">
          {[...history].reverse().map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm">
              <span className="tabular w-28 shrink-0 text-slate-500">{formatDateTime(r.analyzedAt)}</span>
              <span className="min-w-0 flex-1 truncate font-medium text-slate-700">
                {PHASE_LABEL[r.phase]} · {TIME_SLOTS.find((s) => s.key === timeSlotOf(r.analyzedAt))!.label}
              </span>
              <span className={cn("tabular font-bold", RISK_META[r.riskLevel].text)}>{r.riskScore}</span>
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}
