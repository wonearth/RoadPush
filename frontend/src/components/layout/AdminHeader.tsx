"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ButtonLink } from "../ui/Button";
import { getPageMeta } from "./navigation";
import { UserMenu } from "./UserMenu";

/** 페이지 제목 영역: 제목·설명 + 사용자 메뉴, 아래에 굵은 구분선 */
export function AdminHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const meta = getPageMeta(pathname);

  return (
    <header className="px-4 pt-5 sm:px-8 sm:pt-7">
      <div className="flex items-end gap-3 border-b-2 border-slate-900 pb-4">
        <button
          type="button"
          onClick={onOpenMenu}
          className="-ml-1 self-center rounded-lg p-1.5 text-slate-700 hover:bg-slate-200 lg:hidden"
          aria-label="메뉴 열기"
        >
          <Menu className="size-6" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[22px] font-bold text-slate-900 sm:text-[26px]">{meta.title}</h1>
        </div>
        {user ? (
          <UserMenu user={user} onSignOut={signOut} />
        ) : (
          <ButtonLink href="/login" variant="secondary" size="sm">
            로그인
          </ButtonLink>
        )}
      </div>
    </header>
  );
}
