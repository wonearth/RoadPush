import Link from "next/link";
import { RISK_LEVELS, RISK_META } from "@/constants/risk";
import type { RiskLevel } from "@/types";

/** 위험도 단계별 구간 수 막대 (위험 → 안전 순). hrefOf 가 있으면 각 줄이 해당 등급 목록으로 가는 링크가 된다. */
export function RiskDistribution({
  distribution,
  hrefOf,
}: {
  distribution: Record<RiskLevel, number>;
  hrefOf?: (level: RiskLevel) => string;
}) {
  const total = RISK_LEVELS.reduce((s, lv) => s + distribution[lv], 0) || 1;
  return (
    <div>
      <ul className="space-y-3.5">
        {[...RISK_LEVELS].reverse().map((lv) => {
          const row = (
            <>
              <span className={`w-9 shrink-0 font-bold ${RISK_META[lv].text}`}>{RISK_META[lv].label}</span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${(distribution[lv] / total) * 100}%`, backgroundColor: RISK_META[lv].hex }}
                />
              </span>
              <span className="tabular w-6 text-right font-bold text-slate-900">{distribution[lv]}</span>
            </>
          );
          return (
            <li key={lv} className="text-[15px]">
              {hrefOf ? (
                <Link
                  href={hrefOf(lv)}
                  aria-label={`${RISK_META[lv].label} 구간 목록 보기`}
                  className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-0.5 transition-colors hover:bg-slate-50"
                >
                  {row}
                </Link>
              ) : (
                <div className="flex items-center gap-3">{row}</div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="tabular mt-4 text-[13px] text-slate-500">
        {RISK_LEVELS.map((lv) => `${RISK_META[lv].label} ${RISK_META[lv].min}~${RISK_META[lv].max}`).join(" · ")}
      </p>
    </div>
  );
}
