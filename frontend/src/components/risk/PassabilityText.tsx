import { PASSABILITY_META, getPassability } from "@/constants/risk";
import { cn } from "@/lib/cn";

/** 통행 판단 한 줄 (예: "차도 우회 필요") — detail 이면 설명 문장까지 */
export function PassabilityText({
  value,
  detail = false,
  className,
}: {
  value: { riskScore: number; roadDetourRequired: boolean };
  detail?: boolean;
  className?: string;
}) {
  const meta = PASSABILITY_META[getPassability(value)];
  return (
    <span className={cn("block", className)}>
      <span className="font-bold text-slate-900">{meta.label}</span>
      {detail && <span className="mt-0.5 block text-sm font-normal text-slate-600">{meta.detail}</span>}
    </span>
  );
}
