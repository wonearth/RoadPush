"use client";

import { LogIn, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ButtonLink } from "../ui/Button";
import { getPageMeta } from "./navigation";
import { UserMenu } from "./UserMenu";

export function AdminHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
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
      {user ? (
        <UserMenu user={user} onSignOut={signOut} />
      ) : (
        <ButtonLink href="/login" variant="secondary" size="sm" icon={<LogIn className="size-3.5" />}>
          로그인
        </ButtonLink>
      )}
    </header>
  );
}
