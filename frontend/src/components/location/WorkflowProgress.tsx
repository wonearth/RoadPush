import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export const WORKFLOW_STEPS = ["발견", "조치 예정", "조치 완료", "개선 확인"];

/** 발견 → 조치 예정 → 조치 완료 → 개선 확인 관리 단계 표시 (current 가 단계 수 이상이면 모두 완료) */
export function WorkflowProgress({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
      {WORKFLOW_STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-1.5">
            <span
              aria-current={active ? "step" : undefined}
              className={cn(
                "inline-flex items-center gap-1",
                done && "text-slate-500",
                active && "font-bold text-brand-700 underline decoration-2 underline-offset-[6px]",
                !done && !active && "text-slate-300",
              )}
            >
              {done && <Check className="size-3.5" />}
              {label}
            </span>
            {i < WORKFLOW_STEPS.length - 1 && <ChevronRight className="size-3.5 text-slate-300" />}
          </li>
        );
      })}
    </ol>
  );
}
