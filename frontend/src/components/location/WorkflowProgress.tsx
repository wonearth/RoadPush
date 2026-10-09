import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export const WORKFLOW_STEPS = ["발견", "조치 예정", "조치 완료", "개선 확인"];

/** 발견 → 조치 예정 → 조치 완료 → 개선 확인 관리 단계 표시 (current 가 단계 수 이상이면 모두 완료) */
export function WorkflowProgress({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {WORKFLOW_STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                done && "bg-brand-50 text-brand-700",
                active && "bg-brand-600 text-white",
                !done && !active && "bg-slate-100 text-slate-400",
              )}
            >
              {done && <Check className="size-3" />}
              {label}
            </span>
            {i < WORKFLOW_STEPS.length - 1 && <span className={cn("h-px w-4", done ? "bg-brand-300" : "bg-slate-200")} />}
          </li>
        );
      })}
    </ol>
  );
}
