import { RISK_META } from "@/constants/risk";
import { cn } from "@/lib/cn";
import type { RiskLevel } from "@/types";

/** 0~100 위험도 막대 */
export function RiskBar({ score, level, className }: { score: number; level: RiskLevel; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: RISK_META[level].hex }} />
    </div>
  );
}

/** 유효 보행공간 vs 잠식 공간 비율 막대 */
export function WalkableBar({
  walkableRatio,
  showLabels = false,
  className,
}: {
  walkableRatio: number;
  showLabels?: boolean;
  className?: string;
}) {
  const walkable = Math.round(walkableRatio * 100);
  return (
    <div className={className}>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-emerald-500" style={{ width: `${walkable}%` }} />
        <div
          className="h-full bg-[repeating-linear-gradient(135deg,#f87171_0_4px,#fca5a5_4px_8px)]"
          style={{ width: `${100 - walkable}%` }}
        />
      </div>
      {showLabels && (
        <div className="mt-1.5 flex justify-between text-[11px] font-medium">
          <span className="text-emerald-700">유효 보행공간 {walkable}%</span>
          <span className="text-red-600">잠식 {100 - walkable}%</span>
        </div>
      )}
    </div>
  );
}
