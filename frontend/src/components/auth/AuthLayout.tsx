import type { ReactNode } from "react";
import { Logo } from "../layout/Logo";

/** 로그인·회원가입 화면 — 가운데 폼 하나만 둔다 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-100 px-4 py-12 sm:justify-center">
      <main className="w-full max-w-sm">
        <Logo />
        <div className="mt-6 rounded-2xl bg-white px-6 py-7 sm:px-8">{children}</div>
        <p className="mt-6 text-center text-xs text-slate-400">보행공간 단절 위험구간 관리 시스템</p>
      </main>
    </div>
  );
}
