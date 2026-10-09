import type { ReactNode } from "react";
import { Card } from "../ui/Card";
import { InfoTip } from "../ui/InfoTip";

/** 큰 숫자 중심의 지표 카드 — info 가 있으면 제목 옆 ❓ 로 기준을 설명한다. */
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
    <Card className="px-6 py-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[15px] text-slate-500">{label}</p>
        {info && <InfoTip text={info} label={`${label} 기준 보기`} />}
      </div>
      <p className="mt-2 flex items-baseline gap-1">
        <span className="tabular text-[38px] leading-none font-extrabold tracking-tight text-slate-900">{value}</span>
        {unit && <span className="text-base text-slate-500">{unit}</span>}
      </p>
      {hint && <p className="mt-2 text-sm text-slate-500">{hint}</p>}
    </Card>
  );
}
