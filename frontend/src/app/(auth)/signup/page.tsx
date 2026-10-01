"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PasswordField, TextField } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/States";
import { useAuth } from "@/hooks/useAuth";
import type { SignUpInput } from "@/types";

type FormState = SignUpInput & { passwordConfirm: string };
type Errors = Partial<Record<keyof FormState, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = "이름을 입력해 주세요.";
  if (!f.organization.trim()) e.organization = "소속기관을 입력해 주세요.";
  if (!EMAIL_RE.test(f.email.trim())) e.email = "올바른 이메일 형식이 아닙니다.";
  if (f.password.length < 8) e.password = "비밀번호는 8자 이상이어야 합니다.";
  if (f.passwordConfirm !== f.password) e.passwordConfirm = "비밀번호가 일치하지 않습니다.";
  return e;
}

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [form, setForm] = useState<FormState>({ name: "", organization: "", email: "", password: "", passwordConfirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await signUp({ name: form.name, organization: form.organization, email: form.email, password: form.password });
      router.push("/dashboard");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-slate-900">관리자 회원가입</h2>
      <p className="mt-1.5 text-sm text-slate-500">소속기관 담당자 정보를 입력해 주세요.</p>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <TextField label="이름" autoComplete="name" placeholder="홍길동" value={form.name} onChange={set("name")} error={errors.name} />
        <TextField
          label="소속기관"
          autoComplete="organization"
          placeholder="예: 서대문구청 도로과"
          value={form.organization}
          onChange={set("organization")}
          error={errors.organization}
        />
        <TextField
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="name@organization.go.kr"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
        />
        <PasswordField
          label="비밀번호"
          autoComplete="new-password"
          placeholder="8자 이상"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
        />
        <PasswordField
          label="비밀번호 확인"
          autoComplete="new-password"
          placeholder="비밀번호 재입력"
          value={form.passwordConfirm}
          onChange={set("passwordConfirm")}
          error={errors.passwordConfirm}
        />
        {submitError && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700">{submitError}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting && <Spinner />}
          회원가입
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          로그인
        </Link>
      </p>
    </>
  );
}
