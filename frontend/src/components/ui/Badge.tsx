import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        className ?? "bg-slate-50 text-slate-600 ring-slate-500/20",
      )}
    >
      {children}
    </span>
  );
}
