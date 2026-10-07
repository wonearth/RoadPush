import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/cn";

/** 개발용 mock 데이터임을 명시하는 표시. 실제 분석 결과로 오인되지 않도록 사용한다. */
export function MockBadge({ className, label = "개발용 Mock 데이터" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800",
        className,
      )}
    >
      <FlaskConical className="size-3" aria-hidden />
      {label}
    </span>
  );
}
