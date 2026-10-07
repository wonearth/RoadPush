import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { RISK_META } from "@/constants/risk";
import { formatDateTime, formatObstacles } from "@/lib/format";
import type { AnalysisResult } from "@/types";
import { MediaFrame } from "../media/MediaFrame";
import { RiskBadge } from "../risk/RiskBadge";

function Snapshot({ title, result, tone }: { title: string; result: AnalysisResult; tone: "before" | "after" }) {
  const meta = RISK_META[result.riskLevel];
  return (
    <div className="flex-1 rounded-2xl bg-slate-50 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span
          className={
            tone === "before"
              ? "rounded-md bg-slate-900 px-2 py-0.5 text-xs font-bold text-white"
              : "rounded-md bg-brand-600 px-2 py-0.5 text-xs font-bold text-white"
          }
        >
          {title}
        </span>
        <span className="tabular text-[11px] text-slate-400">{formatDateTime(result.analyzedAt)}</span>
      </div>
      <MediaFrame
        variant="result"
        src={result.originalImageUrl}
        resultSrc={result.resultImageUrl}
        overlay={result.overlay}
        walkableRatio={result.walkableRatio}
        roadDetourRequired={result.roadDetourRequired}
      />
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs text-slate-500">위험도</dt>
          <dd className="mt-0.5 flex items-center gap-1.5">
            <span className={`tabular text-2xl font-bold ${meta.text}`}>{result.riskScore}</span>
            <RiskBadge level={result.riskLevel} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">유효 보행공간</dt>
          <dd className="tabular mt-0.5 text-2xl font-bold text-emerald-600">{Math.round(result.walkableRatio * 100)}%</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-slate-500">주요 원인</dt>
          <dd className="mt-0.5 text-[13px] font-semibold text-slate-800">
            {result.obstacleTypes.length ? formatObstacles(result.obstacleTypes) : "장애물 제거"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function ChangeBar({
  label,
  before,
  after,
  unit,
  beforeColor,
  afterColor,
  goodWhenDown,
}: {
  label: string;
  before: number;
  after: number;
  unit: string;
  beforeColor: string;
  afterColor: string;
  goodWhenDown: boolean;
}) {
  const diff = after - before;
  const improved = goodWhenDown ? diff < 0 : diff > 0;
  const Icon = diff < 0 ? TrendingDown : TrendingUp;
  const deltaText = unit === "%" ? `${Math.abs(diff)}%p ${diff > 0 ? "증가" : "감소"}` : `${Math.abs(diff)}점 ${diff > 0 ? "증가" : "감소"}`;
  return (
    <div className="rounded-2xl bg-slate-50 p-6">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="tabular text-xl font-bold text-slate-400">
          {before}
          {unit}
        </span>
        <ArrowRight className="size-4 self-center text-slate-300" />
        <span className="tabular text-3xl font-bold text-slate-900">
          {after}
          {unit}
        </span>
      </div>
      <p className={`mt-1 inline-flex items-center gap-1 text-sm font-bold ${improved ? "text-emerald-600" : "text-red-600"}`}>
        <Icon className="size-4" /> {deltaText}
      </p>
      <div className="mt-4 space-y-2">
        {[
          { tag: "조치 전", value: before, color: beforeColor },
          { tag: "조치 후", value: after, color: afterColor },
        ].map((row) => (
          <div key={row.tag} className="flex items-center gap-3">
            <span className="w-11 shrink-0 text-[11px] font-medium text-slate-500">{row.tag}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width: `${row.value}%`, backgroundColor: row.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 조치 전·후 비교 — 위험도 감소와 유효 보행공간 증가를 한눈에 보여준다. */
export function BeforeAfterComparison({ before, after }: { before: AnalysisResult; after: AnalysisResult }) {
  const walkBefore = Math.round(before.walkableRatio * 100);
  const walkAfter = Math.round(after.walkableRatio * 100);
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
        <Snapshot title="Before · 조치 전" result={before} tone="before" />
        <div className="flex justify-center text-slate-300">
          <ArrowRight className="size-6 rotate-90 lg:rotate-0" />
        </div>
        <Snapshot title="After · 조치 후 재분석" result={after} tone="after" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ChangeBar
          label="보행공간 단절 위험도"
          before={before.riskScore}
          after={after.riskScore}
          unit=""
          beforeColor={RISK_META[before.riskLevel].hex}
          afterColor={RISK_META[after.riskLevel].hex}
          goodWhenDown
        />
        <ChangeBar
          label="유효 보행공간 비율"
          before={walkBefore}
          after={walkAfter}
          unit="%"
          beforeColor="#94a3b8"
          afterColor="#10b981"
          goodWhenDown={false}
        />
      </div>
    </div>
  );
}
