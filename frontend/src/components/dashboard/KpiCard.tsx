import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { InfoTip } from "../ui/InfoTip";

/** 요약 띠의 지표 한 칸 — 아이콘으로 지표 성격을 바로 알아보게 하고, info 가 있으면 제목 옆 ❓ 로 기준을 설명한다. */
export function KpiCard({
  label,
  value,
  unit,
  hint,
  info,
  icon,
  tone = "bg-slate-100 text-slate-500",
}: {
  label: string;
  value: ReactNode;
  unit?: ReactNode;
  hint?: ReactNode;
  info?: string;
  icon?: ReactNode;
  /** 아이콘 배경·색 (예: "bg-red-50 text-red-600") */
  tone?: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-white px-5 py-4">
      {icon && <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", tone)}>{icon}</span>}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-slate-500">{label}</p>
          {info && <InfoTip text={info} label={`${label} 기준 보기`} />}
        </div>
        <p className="mt-0.5 flex items-baseline gap-1">
          <span className="tabular text-[26px] leading-tight font-bold text-slate-900">{value}</span>
          {unit && <span className="text-sm text-slate-500">{unit}</span>}
        </p>
        {hint && <p className="mt-0.5 text-[13px] text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}

/** 지표들을 한 줄로 묶는 요약 띠 (휴대폰 2칸, 넓은 화면 5칸) */
export function KpiStrip({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-100 lg:grid-cols-5 [&>*:last-child:nth-child(odd)]:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1">
      {children}
    </div>
  );
}
