import { RISK_LEVELS, RISK_META } from "@/constants/risk";
import type { RiskLevel } from "@/types";

/** 위험도 단계별 구간 수 막대 (위험 → 안전 순) */
export function RiskDistribution({ distribution }: { distribution: Record<RiskLevel, number> }) {
  const total = RISK_LEVELS.reduce((s, lv) => s + distribution[lv], 0) || 1;
  return (
    <div>
      <ul className="space-y-3.5">
        {[...RISK_LEVELS].reverse().map((lv) => (
          <li key={lv} className="flex items-center gap-3 text-[15px]">
            <span className={`w-9 shrink-0 font-bold ${RISK_META[lv].text}`}>{RISK_META[lv].label}</span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <span
                className="block h-full rounded-full"
                style={{ width: `${(distribution[lv] / total) * 100}%`, backgroundColor: RISK_META[lv].hex }}
              />
            </span>
            <span className="tabular w-6 text-right font-bold text-slate-900">{distribution[lv]}</span>
          </li>
        ))}
      </ul>
      <p className="tabular mt-4 text-[13px] text-slate-500">
        {RISK_LEVELS.map((lv) => `${RISK_META[lv].label} ${RISK_META[lv].min}~${RISK_META[lv].max}`).join(" · ")}
      </p>
    </div>
  );
}
