"use client";

import { LogIn, LogOut, Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { IS_MOCK_MODE } from "@/services";
import { ButtonLink } from "../ui/Button";
import { MockBadge } from "../ui/MockNotice";
import { getPageMeta } from "./navigation";

export function AdminHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const meta = getPageMeta(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        className="-ml-1 rounded-md p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="메뉴 열기"
      >
        <Menu className="size-5" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[17px] font-bold text-slate-900">{meta.title}</h1>
        <p className="hidden truncate text-xs text-slate-500 sm:block">{meta.description}</p>
      </div>
      {IS_MOCK_MODE && <MockBadge className="hidden md:inline-flex" />}
      {user ? (
        <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
          <div className="hidden text-right sm:block">
            <p className="text-[13px] font-semibold text-slate-800">{user.name}</p>
            <p className="text-[11px] text-slate-500">{user.organization}</p>
          </div>
          <div className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-[13px] font-bold text-brand-700">
            {user.name.slice(0, 1)}
          </div>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="로그아웃"
            title="로그아웃"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      ) : (
        <ButtonLink href="/login" variant="secondary" size="sm" icon={<LogIn className="size-3.5" />}>
          로그인
        </ButtonLink>
      )}
    </header>
  );
}
