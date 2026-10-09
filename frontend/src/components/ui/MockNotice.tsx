import { cn } from "@/lib/cn";

/** 개발용 mock 데이터임을 명시하는 표시. 실제 분석 결과로 오인되지 않도록 사용한다. */
export function MockBadge({ className, label = "예시 데이터" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-slate-300 px-1.5 py-px text-xs font-medium text-slate-500",
        className,
      )}
    >
      {label}
    </span>
  );
}
