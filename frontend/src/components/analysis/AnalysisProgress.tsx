import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Spinner } from "../ui/States";

export const ANALYSIS_STEPS = [
  "영상 전처리 · 개인정보 비식별화",
  "보도 · 차도 영역 구분",
  "보행 방해 요인 탐지",
  "유효 보행공간 연속성 판단",
  "단절 위험도 산출",
];

export function AnalysisProgress({ current }: { current: number }) {
  return (
    <ol className="space-y-3">
      {ANALYSIS_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className="flex items-center gap-3 text-sm">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                done && "bg-brand-600 text-white",
                active && "bg-brand-50 text-brand-600 ring-1 ring-brand-200",
                !done && !active && "bg-slate-100 text-slate-400",
              )}
            >
              {done ? <Check className="size-3.5" /> : active ? <Spinner className="size-3.5" /> : i + 1}
            </span>
            <span className={cn(done || active ? "font-medium text-slate-800" : "text-slate-400")}>{step}</span>
          </li>
        );
      })}
    </ol>
  );
}
