import type { ReactNode } from "react";
import { InfoTip } from "../ui/InfoTip";

/** 요약 띠의 지표 한 칸 — info 가 있으면 제목 옆 ❓ 로 기준을 설명한다. */
export function KpiCard({
  label,
  value,
  unit,
  hint,
  info,
}: {
  label: string;
  value: ReactNode;
  unit?: ReactNode;
  hint?: ReactNode;
  info?: string;
}) {
  return (
    <div className="bg-white px-5 py-4">
      <div className="flex items-center gap-1.5">
        <p className="text-sm text-slate-500">{label}</p>
        {info && <InfoTip text={info} label={`${label} 기준 보기`} />}
      </div>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="tabular text-[28px] leading-tight font-bold text-slate-900">{value}</span>
        {unit && <span className="text-sm text-slate-500">{unit}</span>}
        {hint && <span className="ml-auto text-[13px] text-slate-400">{hint}</span>}
      </p>
    </div>
  );
}

/** 지표들을 한 줄로 묶는 요약 띠 */
export function KpiStrip({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-100 xl:grid-cols-4">{children}</div>;
}
