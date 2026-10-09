import { Footprints, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { ObstacleType } from "@/types";
import { ObstacleTags } from "./ObstacleTags";
import { WalkableBar } from "./RiskBar";

interface Metrics {
  walkableRatio: number;
  obstructionRatio: number;
  roadDetourRequired: boolean;
  obstacleTypes: ObstacleType[];
}

/** "판단 근거" — 남은 보행공간 · 공간 잠식 · 차도 이탈 · 주요 원인 */
export function RiskMetrics({ metrics, className, extra }: { metrics: Metrics; className?: string; extra?: ReactNode }) {
  return (
    <dl className={cn("divide-y divide-slate-100", className)}>
      <div className="pb-4">
        <dt className="text-xs font-medium text-slate-500">유효 보행공간</dt>
        <dd className="mt-1">
          <span className="tabular text-2xl font-bold text-emerald-600">{Math.round(metrics.walkableRatio * 100)}%</span>
          <WalkableBar walkableRatio={metrics.walkableRatio} className="mt-2" />
        </dd>
      </div>
      <div className="grid grid-cols-2 gap-4 py-4">
        <div>
          <dt className="text-xs font-medium text-slate-500">공간 잠식률</dt>
          <dd className="tabular mt-1 text-xl font-bold text-slate-900">{Math.round(metrics.obstructionRatio * 100)}%</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">차도 우회 필요</dt>
          <dd className="mt-1">
            {metrics.roadDetourRequired ? (
              <span className="inline-flex items-center gap-1 text-xl font-bold text-red-600">
                <Footprints className="size-5" /> 있음
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xl font-bold text-slate-700">
                <ShieldCheck className="size-5 text-emerald-600" /> 없음
              </span>
            )}
          </dd>
        </div>
      </div>
      <div className="py-4">
        <dt className="mb-2 text-xs font-medium text-slate-500">탐지 원인</dt>
        <dd>
          <ObstacleTags types={metrics.obstacleTypes} />
        </dd>
      </div>
      {extra}
    </dl>
  );
}
