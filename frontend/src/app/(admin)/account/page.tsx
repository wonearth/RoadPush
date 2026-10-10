"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { PasswordField, TextField } from "@/components/ui/Field";
import { EmptyState, Skeleton, Spinner } from "@/components/ui/States";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { DeactivationReason } from "@/types";

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
      <Button type="submit" variant="secondary" disabled={saving || !current || !next} icon={saving ? <Spinner /> : undefined}>
        비밀번호 변경
      </Button>
    </form>
  );
}

const REASONS: { value: DeactivationReason; label: string }[] = [
  { value: "RETIRED", label: "퇴직" },
  { value: "TRANSFERRED", label: "전보·부서 이동" },
  { value: "ROLE_CHANGED", label: "담당 업무 변경" },
  { value: "OTHER", label: "기타" },
];
const reasonLabel = (r: DeactivationReason) => REASONS.find((x) => x.value === r)?.label ?? r;

function DeactivationDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { requestDeactivation } = useAuth();
  const [reason, setReason] = useState<DeactivationReason | null>(null);
  const [memo, setMemo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return setError("해지 사유를 선택해 주세요.");
    setSaving(true);
    setError(null);
    try {
      await requestDeactivation(password, reason, memo);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "해지 신청에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="계정 해지 신청"
      description="기관 관리자 승인 후 계정이 비활성화됩니다. 승인 전까지는 계속 이용할 수 있으며, 처리한 조치 이력은 해지 후에도 보존됩니다."
    >
      <form onSubmit={submit} className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-700">해지 사유</legend>
          <div className="grid grid-cols-2 gap-1.5">
            {REASONS.map((r) => (
              <label
                key={r.value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm",
                  reason === r.value ? "bg-brand-50 font-semibold text-brand-800 ring-2 ring-brand-500 ring-inset" : "bg-slate-50 text-slate-700",
                )}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="accent-brand-600"
                />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>
        <TextField label="비고 (선택)" placeholder="예: 10월 31일 자로 교통행정과 전보" value={memo} onChange={(e) => setMemo(e.target.value)} />
        <PasswordField label="비밀번호 확인" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" variant="danger" disabled={!password || saving}>
            {saving && <Spinner />}
            해지 신청
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default function AccountPage() {
  const { user, loading, cancelDeactivation } = useAuth();
  const [requestOpen, setRequestOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const request = user?.deactivationRequest;

  const cancel = async () => {
    setCanceling(true);
    try {
      await cancelDeactivation();
    } finally {
      setCanceling(false);
    }
  };

  if (loading) return <Skeleton className="m-6 h-64 rounded-xl" />;
  if (!user) {
    return (
      <EmptyState
        className="py-24"
        title="로그인이 필요합니다"
        description="계정 설정은 로그인한 관리자만 이용할 수 있습니다."
        action={
          <ButtonLink href="/login?next=/account">
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

      {request ? (
        <Card>
          <CardHeader
            title="계정 해지 신청됨"
            action={
              <Button variant="secondary" size="sm" onClick={cancel} disabled={canceling}>
                {canceling && <Spinner />}
                신청 취소
              </Button>
            }
          />
          <CardBody>
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              {[
                ["상태", "기관 관리자 승인 대기"],
                ["신청일", formatDate(request.requestedAt)],
                ["사유", reasonLabel(request.reason) + (request.memo ? ` (${request.memo})` : "")],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-medium text-slate-500">{label}</dt>
                  <dd className="mt-1 font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
      ) : (
        <div className="px-1 pt-4 text-right">
          <button
            type="button"
            onClick={() => setRequestOpen(true)}
            className="text-xs text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
          >
            계정 해지 신청
          </button>
        </div>
      )}
      {requestOpen && <DeactivationDialog open onClose={() => setRequestOpen(false)} />}
    </div>
  );
}
