import Link from "next/link";
import { Logo } from "../layout/Logo";
import { ButtonLink } from "../ui/Button";

export function PublicNav() {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-6xl items-center gap-10 px-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-7 text-base text-slate-600 md:flex">
          <Link href="#about" className="hover:text-slate-900">
            서비스 소개
          </Link>
          <Link href="#how" className="hover:text-slate-900">
            주요 기능
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ButtonLink href="/signup" variant="secondary" size="sm" className="hidden sm:inline-flex">
            회원가입
          </ButtonLink>
          <ButtonLink href="/login" size="sm">
            관리자 로그인
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
