"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { IS_MOCK_MODE, resetMockData } from "@/services";
import { Logo } from "./Logo";
import { ADMIN_NAV } from "./navigation";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname.startsWith(href) || (href === "/map" && pathname.startsWith("/locations/"));

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo href="/dashboard" />
      </div>
      <nav className="flex-1 space-y-0.5 px-3 pt-2" aria-label="관리자 메뉴">
        {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(href) ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Icon className="size-[18px]" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-slate-200 px-5 py-4">
        <p className="text-xs font-bold text-slate-700">RoadPush MVP</p>
        <p className="mt-0.5 text-[11px] text-slate-400">AI Life Solution Challenge 2026</p>
        {IS_MOCK_MODE && (
          <button
            type="button"
            onClick={() => {
              if (confirm("데모 중 변경한 등록·조치·재분석 내용을 초기 mock 데이터로 되돌릴까요?")) {
                resetMockData();
                window.location.reload();
              }
            }}
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-600"
          >
            <RotateCcw className="size-3" aria-hidden />
            데모 데이터 초기화
          </button>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 border-r border-slate-200 bg-white lg:block">
      <SidebarContent />
    </aside>
  );
}
