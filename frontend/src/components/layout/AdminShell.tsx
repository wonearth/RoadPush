"use client";

import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminHeader } from "./AdminHeader";
import { Sidebar, SidebarContent } from "./Sidebar";

/**
 * 로그인 필수 여부.
 * MVP 데모에서는 로그인 없이도 화면을 둘러볼 수 있도록 false.
 * TODO(firebase): Firebase Authentication 연결 후 true 로 변경
 */
const REQUIRE_AUTH = false;

export function AdminShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (REQUIRE_AUTH && !loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  return (
    <div className="min-h-screen">
      <Sidebar />
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal>
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-3 rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
              aria-label="메뉴 닫기"
            >
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}
      <div className="flex min-h-screen flex-col lg:pl-56">
        <AdminHeader onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
