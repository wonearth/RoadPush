"use client";

import { ChevronDown, LogOut, UserCog } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@/types";

/** 헤더 오른쪽 사용자 메뉴: 계정 설정 · 로그아웃 */
export function UserMenu({ user, onSignOut }: { user: User; onSignOut: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[15px] hover:bg-slate-200/60"
      >
        <span className="font-bold text-slate-900">{user.name}</span>
        {user.organization && <span className="hidden text-slate-600 sm:inline">· {user.organization}</span>}
        <ChevronDown className="size-4 text-slate-500" />
      </button>

      {open && (
        <div role="menu" className="absolute top-full right-0 z-30 mt-2 w-56 rounded-xl bg-white py-2 shadow-[0_8px_24px_rgba(25,31,40,0.12)]">
          <p className="truncate border-b border-slate-100 px-4 pb-2.5 text-[13px] text-slate-500">{user.email}</p>
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-[15px] text-slate-700 hover:bg-slate-100"
          >
            <UserCog className="size-4 text-slate-400" /> 계정 설정
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await onSignOut();
              router.push("/login");
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-[15px] text-slate-700 hover:bg-slate-100"
          >
            <LogOut className="size-4 text-slate-400" /> 로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
