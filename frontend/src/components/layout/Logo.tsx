import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * RoadPush 로고 마크 (A-3+).
 * 왼쪽 밝은 띠 = 보도, 오른쪽 파란 면 + 점선 = 차도, 노란 블록 = 장애물.
 * 장애물을 피해 차도로 밀려 나간 보행 경로가 RoadPush 의 'P' 를 이룬다.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-8", className)} aria-hidden>
      <rect width="64" height="64" rx="15" fill="#2553eb" />
      <path d="M15 0H30V64H15A15 15 0 0 1 0 49V15A15 15 0 0 1 15 0Z" fill="#dbe8fe" />
      <path
        d="M52 4V10M52 18V26M52 34V42M52 50V58"
        stroke="#fff"
        strokeOpacity={0.55}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <rect x="11" y="19" width="15" height="15" rx="2.5" fill="#fbbf24" />
      <path
        d="M20 57V39H31C38.5 39 43 34.5 43 26.5C43 18.5 38.5 14 31 14H20V7"
        stroke="#172152"
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
