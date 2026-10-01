import { RISK_LEVELS, RISK_META } from "@/constants/risk";
import type { RiskLevel } from "@/types";

export function RiskDistribution({ distribution }: { distribution: Record<RiskLevel, number> }) {
  const total = RISK_LEVELS.reduce((s, lv) => s + distribution[lv], 0) || 1;
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        {RISK_LEVELS.map((lv) => (
          <div
            key={lv}
            style={{ width: `${(distribution[lv] / total) * 100}%`, backgroundColor: RISK_META[lv].hex }}
            title={`${RISK_META[lv].label} ${distribution[lv]}개`}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {[...RISK_LEVELS].reverse().map((lv) => (
          <li key={lv} className="flex items-center gap-3 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: RISK_META[lv].hex }} />
            <span className="w-8 font-semibold text-slate-800">{RISK_META[lv].label}</span>
            <span className="tabular flex-1 text-xs text-slate-400">
              {RISK_META[lv].min}~{RISK_META[lv].max}점 · {RISK_META[lv].description}
            </span>
            <span className="tabular font-semibold text-slate-900">{distribution[lv]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
