import { RISK_META, STATUS_META } from "@/constants/risk";
import { cn } from "@/lib/cn";
import type { LocationStatus, RiskLevel } from "@/types";
import { Badge } from "../ui/Badge";

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <Badge className={cn(RISK_META[level].badge, className)}>
      <span className="size-1.5 rounded-full" style={{ backgroundColor: RISK_META[level].hex }} aria-hidden />
      {RISK_META[level].label}
    </Badge>
  );
}

export function StatusBadge({ status, className }: { status: LocationStatus; className?: string }) {
  return (
    <Badge className={cn(STATUS_META[status].badge, className)}>
      <span className={cn("size-1.5 rounded-full", STATUS_META[status].dot)} aria-hidden />
      {STATUS_META[status].label}
    </Badge>
  );
}

/** "82 / 위험" 형태의 위험도 표기 */
export function RiskScore({
  score,
  level,
  size = "md",
  className,
}: {
  score: number;
  level: RiskLevel;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = { sm: "text-base", md: "text-xl", lg: "text-3xl", xl: "text-5xl" } as const;
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className={cn("tabular font-bold tracking-tight", sizes[size], RISK_META[level].text)}>{score}</span>
      <RiskBadge level={level} />
    </span>
  );
}
