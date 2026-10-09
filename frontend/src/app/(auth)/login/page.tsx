"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PasswordField, TextField } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/States";
import { useAuth } from "@/hooks/useAuth";

/** 로그인 후 이동할 주소는 이 사이트 안의 경로만 허용한다. ("//외부도메인" 형태 차단) */
function isSafeNextPath(path: string | null): path is string {
  return Boolean(path && path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\"));
}

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
      router.push(isSafeNextPath(next) ? next : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-slate-900">관리자 로그인</h2>
      <p className="mt-1.5 text-sm text-slate-500">기관 담당자 계정으로 로그인합니다.</p>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <TextField
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="name@organization.go.kr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          label="비밀번호"
          autoComplete="current-password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting && <Spinner />}
          로그인
        </Button>
      </form>


      <p className="mt-8 text-center text-sm text-slate-500">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-700">
          회원가입
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
