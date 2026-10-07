import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[13px] font-medium whitespace-nowrap",
        className ?? "bg-slate-100 text-slate-700",
      )}
    >
      {children}
    </span>
  );
}
