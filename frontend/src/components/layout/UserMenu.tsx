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
    <div ref={ref} className="relative border-l border-slate-200 pl-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-3 rounded-lg py-1 pr-1 pl-2 hover:bg-slate-50"
      >
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-semibold text-slate-800">{user.name}</span>
          <span className="block text-[11px] text-slate-500">{user.organization}</span>
        </span>
        <span className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-[13px] font-bold text-brand-700">
          {user.name.slice(0, 1)}
        </span>
        <ChevronDown className="size-3.5 text-slate-400" />
      </button>

      {open && (
        <div role="menu" className="absolute top-full right-0 z-30 mt-2 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <p className="truncate border-b border-slate-100 px-3 py-2 text-xs text-slate-500">{user.email}</p>
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
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
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="size-4 text-slate-400" /> 로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
