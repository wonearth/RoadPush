import Link from "next/link";
import { Logo } from "../layout/Logo";
import { ButtonLink } from "../ui/Button";

export function PublicNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="#about" className="hover:text-slate-900">
            서비스 소개
          </Link>
          <Link href="#features" className="hover:text-slate-900">
            주요 기능
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost" size="sm">
            로그인
          </ButtonLink>
          <ButtonLink href="/dashboard" size="sm">
            대시보드 체험하기
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
