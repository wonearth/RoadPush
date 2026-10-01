import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "../layout/Logo";

const POINTS = [
  "AI가 보행공간이 끊긴 구간을 사고 이전에 찾아냅니다",
  "위험도 순으로 우선점검 구간을 제시합니다",
  "현장조치 후 재분석으로 개선효과를 확인합니다",
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-950 p-10 text-white lg:flex">
        <Logo tone="light" />
        <div>
          <p className="text-sm font-semibold text-brand-300">RoadPush 관리자</p>
          <h1 className="mt-3 text-[28px] leading-snug font-bold">
            지자체·도로관리기관을 위한
            <br />
            보행안전 관리 플랫폼
          </h1>
          <ul className="mt-8 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[15px] text-brand-100">
                <CheckCircle2 className="mt-0.5 size-[18px] shrink-0 text-brand-400" /> {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-brand-300/70">RoadPush MVP · AI Life Solution Challenge 2026</p>
        {/* 보도 패턴 장식 */}
        <svg className="pointer-events-none absolute -right-16 -bottom-10 w-96 opacity-[0.07]" viewBox="0 0 200 200" aria-hidden>
          {Array.from({ length: 10 }).map((_, r) =>
            Array.from({ length: 10 }).map((_, c) => (
              <rect key={`${r}-${c}`} x={c * 20 + (r % 2) * 10} y={r * 20} width={18} height={18} rx={2} fill="white" />
            )),
          )}
        </svg>
      </aside>
      <main className="flex flex-col bg-white">
        <div className="flex h-16 items-center px-6 lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </main>
    </div>
  );
}
