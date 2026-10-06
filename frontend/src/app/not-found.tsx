import { ArrowLeft, Home } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex h-16 items-center px-6">
        <Logo />
      </div>
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <p className="tabular text-5xl font-bold text-brand-600">404</p>
        <h1 className="mt-4 text-xl font-bold text-slate-900">페이지를 찾을 수 없습니다</h1>
        <p className="mt-2 text-sm text-slate-500">주소가 잘못되었거나 삭제된 페이지입니다.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <ButtonLink href="/" variant="secondary" icon={<Home className="size-4" />}>
            홈으로
          </ButtonLink>
          <ButtonLink href="/dashboard" icon={<ArrowLeft className="size-4" />}>
            대시보드로 이동
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}
