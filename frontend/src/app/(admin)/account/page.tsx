"use client";

import { KeyRound, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { PasswordField } from "@/components/ui/Field";
import { EmptyState, Skeleton, Spinner } from "@/components/ui/States";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/format";

function PasswordChangeForm() {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDone(false);
    if (next.length < 8) return setError("새 비밀번호는 8자 이상이어야 합니다.");
    if (next !== confirm) return setError("새 비밀번호가 일치하지 않습니다.");
    setSaving(true);
    setError(null);
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-sm space-y-4" noValidate>
      <PasswordField label="현재 비밀번호" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      <PasswordField label="새 비밀번호" autoComplete="new-password" placeholder="8자 이상" value={next} onChange={(e) => setNext(e.target.value)} />
      <PasswordField label="새 비밀번호 확인" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      {done && <p className="text-xs font-medium text-emerald-600">비밀번호가 변경되었습니다.</p>}
      <Button type="submit" variant="secondary" disabled={saving || !current || !next} icon={saving ? <Spinner /> : <KeyRound className="size-4" />}>
        비밀번호 변경
      </Button>
    </form>
  );
}

function DeleteAccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { deleteAccount } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount(password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "탈퇴 처리에 실패했습니다.");
      setDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="회원 탈퇴"
      description="계정과 프로필 정보(이름·소속기관·이메일)가 삭제되며 복구할 수 없습니다. 등록한 위험구간과 조치 이력은 기관 관리 데이터로 유지됩니다."
    >
      <form onSubmit={submit} className="space-y-4">
        <PasswordField
          label="비밀번호 확인"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" variant="danger" disabled={!password || deleting}>
            {deleting && <Spinner />}
            탈퇴하기
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default function AccountPage() {
  const { user, loading } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (loading) return <Skeleton className="m-6 h-64 rounded-xl" />;
  if (!user) {
    return (
      <EmptyState
        className="py-24"
        title="로그인이 필요합니다"
        description="계정 설정은 로그인한 관리자만 이용할 수 있습니다."
        action={
          <ButtonLink href="/login?next=/account" icon={<LogIn className="size-4" />}>
            로그인
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="max-w-3xl space-y-5 px-4 pt-5 pb-10 sm:px-8">
      <Card>
        <CardHeader title="내 정보" />
        <CardBody>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {[
              ["이름", user.name],
              ["소속기관", user.organization || "-"],
              ["이메일", user.email],
              ["가입일", formatDate(user.createdAt)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium text-slate-500">{label}</dt>
                <dd className="mt-1 font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="비밀번호 변경" />
        <CardBody>
          <PasswordChangeForm />
        </CardBody>
      </Card>

      <div className="px-1 pt-4 text-right">
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="text-xs text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
        >
          회원 탈퇴
        </button>
      </div>
      <DeleteAccountDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </div>
  );
}
