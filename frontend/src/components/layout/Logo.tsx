import Link from "next/link";
import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-brand-600" />
      {/* 보도(세로) 위로 이어지는 보행 경로 + 차도로 밀려나는 지점 */}
      <path d="M11 25V7" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M11 16h4.5a3.5 3.5 0 0 0 0-7H11" stroke="white" strokeWidth="2.6" fill="none" strokeLinejoin="round" />
      <path d="M15.5 16 21 25" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="23.5" cy="10" r="2.2" fill="#fbbf24" />
    </svg>
  );
}

export function Logo({ href = "/", className, tone = "dark" }: { href?: string; className?: string; tone?: "dark" | "light" }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2", className)} aria-label="RoadPush 홈">
      <LogoMark />
      <span className={cn("text-[17px] font-bold tracking-tight", tone === "dark" ? "text-slate-900" : "text-white")}>
        RoadPush
      </span>
    </Link>
  );
}
