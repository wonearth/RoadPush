"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";
import { ADMIN_NAV } from "./navigation";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname.startsWith(href) || (href === "/map" && pathname.startsWith("/locations/"));

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center px-6">
        <Logo href="/dashboard" />
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="관리자 메뉴">
        {ADMIN_NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "block rounded-xl px-4 py-3 text-base transition-colors",
              isActive(href)
                ? "bg-brand-50 font-bold text-brand-600"
                : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-6 py-6 text-[13px] leading-relaxed text-slate-500">
        <p>RoadPush</p>
        <p>2026 AI 라이프 아이디어 챌린지</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 bg-white lg:block">
      <SidebarContent />
    </aside>
  );
}
