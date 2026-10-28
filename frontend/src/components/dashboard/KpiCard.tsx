import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { InfoTip } from "../ui/InfoTip";

/** 요약 띠의 지표 한 칸 — 아이콘으로 지표 성격을 바로 알아보게 하고, info 가 있으면 제목 옆 ❓ 로 기준을 설명한다.
 *  href 가 있으면 칸 전체가 해당 목록으로 가는 링크가 된다. */
export function KpiCard({
  label,
  value,
  unit,
  hint,
  info,
  icon,
  tone = "bg-slate-100 text-slate-500",
  href,
}: {
  label: string;
  value: ReactNode;
  unit?: ReactNode;
  hint?: ReactNode;
  info?: string;
  icon?: ReactNode;
  /** 아이콘 배경·색 (예: "bg-red-50 text-red-600") */
  tone?: string;
  href?: string;
}) {
  return (
    <div className="group relative flex items-start gap-3 bg-white px-5 py-4 transition-colors has-[a:hover]:bg-slate-50">
      {/* 칸 전체를 덮는 링크. ❓ 버튼은 링크 뒤에 오는 relative 요소라 위에 그려져 따로 눌린다.
          z-index 를 주면 설명 말풍선이 사이드바 아래로 깔리므로 주지 않는다 */}
      {href && <Link href={href} aria-label={`${label} 목록 보기`} className="absolute inset-0" />}
      {/* 눌러서 목록으로 갈 수 있다는 표시 */}
      {href && (
        <ChevronRight
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-slate-300 transition-colors group-has-[a:hover]:text-slate-500"
        />
      )}
      {icon && <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", tone)}>{icon}</span>}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-slate-500">{label}</p>
          {info && (
            <span className="relative inline-flex">
              <InfoTip text={info} label={`${label} 기준 보기`} />
            </span>
          )}
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
