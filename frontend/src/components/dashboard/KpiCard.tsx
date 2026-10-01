import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "../ui/Card";

export function KpiCard({
  label,
  value,
  unit,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  icon: ReactNode;
  accent?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        <span className={cn("flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500", accent)}>
          {icon}
        </span>
      </div>
      <p className="mt-2 flex items-baseline gap-1">
        <span className="tabular text-[28px] font-bold tracking-tight text-slate-900">{value}</span>
        {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
      </p>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </Card>
  );
}
