import { RISK_LEVELS, RISK_META } from "@/constants/risk";
import { cn } from "@/lib/cn";

export function RiskLegend({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600", className)}>
      {RISK_LEVELS.map((lv) => (
        <li key={lv} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: RISK_META[lv].hex }} aria-hidden />
          <span className="font-semibold text-slate-700">{RISK_META[lv].label}</span>
          {!compact && (
            <span className="tabular text-slate-400">
              {RISK_META[lv].min}~{RISK_META[lv].max}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
