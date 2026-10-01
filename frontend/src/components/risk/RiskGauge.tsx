import { RISK_LEVELS, RISK_META } from "@/constants/risk";
import type { RiskLevel } from "@/types";

/** 반원형 위험도 게이지. 구간 경계(25/50/75)를 함께 표시한다. */
export function RiskGauge({ score, level, size = 220 }: { score: number; level: RiskLevel; size?: number }) {
  const r = 80;
  const cx = 100;
  const cy = 96;
  const point = (v: number) => {
    const a = Math.PI * (1 - v / 100);
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const;
  };
  const arc = (from: number, to: number) => {
    const [x1, y1] = point(from);
    const [x2, y2] = point(to);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };
  const [nx, ny] = point(score);

  return (
    <svg viewBox="0 0 200 116" width={size} className="max-w-full" role="img" aria-label={`위험도 ${score}점`}>
      {RISK_LEVELS.map((lv) => (
        <path
          key={lv}
          d={arc(RISK_META[lv].min === 0 ? 0 : RISK_META[lv].min - 1 + 0.6, RISK_META[lv].max - 0.6)}
          stroke={RISK_META[lv].hex}
          strokeOpacity={lv === level ? 0.95 : 0.18}
          strokeWidth={14}
          fill="none"
        />
      ))}
      <circle cx={nx} cy={ny} r={9} fill="white" stroke={RISK_META[level].hex} strokeWidth={4} />
      <text x={cx} y={cy - 14} textAnchor="middle" className="tabular" fontSize="40" fontWeight={700} fill="#0f172a">
        {score}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="11" fill="#64748b">
        / 100
      </text>
      <text x={cx - r} y={cy + 18} textAnchor="middle" fontSize="9" fill="#94a3b8">
        0
      </text>
      <text x={cx + r} y={cy + 18} textAnchor="middle" fontSize="9" fill="#94a3b8">
        100
      </text>
    </svg>
  );
}
