import type { ReactNode } from "react";
import { Card } from "../ui/Card";

/** 큰 숫자 중심의 지표 카드 */
export function KpiCard({ label, value, unit, hint }: { label: string; value: ReactNode; unit?: ReactNode; hint?: ReactNode }) {
  return (
    <Card className="px-6 py-5">
      <p className="text-[15px] text-slate-500">{label}</p>
      <p className="mt-2 flex items-baseline gap-1">
        <span className="tabular text-[38px] leading-none font-extrabold tracking-tight text-slate-900">{value}</span>
        {unit && <span className="text-base text-slate-500">{unit}</span>}
      </p>
      {hint && <p className="mt-2 text-sm text-slate-500">{hint}</p>}
    </Card>
  );
}
