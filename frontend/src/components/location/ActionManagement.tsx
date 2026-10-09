"use client";

import { Camera, Check, Save, XCircle } from "lucide-react";
import { useState } from "react";
import {
  ACTION_META,
  ACTION_TYPES,
  CLOSE_REASONS,
  CLOSE_REASON_META,
  STATUS_META,
  STATUS_ORDER,
  getRecommendedActions,
} from "@/constants/risk";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import type { ActionLog, ActionType, CloseReason, Location, LocationStatus, UpdateActionInput } from "@/types";
import { StatusBadge } from "../risk/RiskBadge";
import { Button } from "../ui/Button";
import { inputClass } from "../ui/Field";
import { Spinner } from "../ui/States";

export function ActionManagement({
  location,
  logs,
  recommendFrom,
  onSave,
  onResolve,
}: {
  location: Location;
  logs: ActionLog[];
  /** 권장 조치를 계산할 장애요인 (최초 분석 기준) */
  recommendFrom: Location["obstacleTypes"];
  onSave: (input: UpdateActionInput) => Promise<void>;
  /** 조치 완료로 바꿀 때 바로 저장하지 않고 사진·재분석 흐름으로 넘긴다 */
  onResolve?: (input: UpdateActionInput) => void;
}) {
  const [status, setStatus] = useState<LocationStatus>(location.status);
  const [closeReason, setCloseReason] = useState<CloseReason | undefined>(location.closeReason);
  const [actions, setActions] = useState<ActionType[]>(location.plannedActions);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const recommended = getRecommendedActions(recommendFrom);
  const closed = status === "CLOSED";
  const dirty =
    status !== location.status ||
    (closed && closeReason !== location.closeReason) ||
    actions.join() !== location.plannedActions.join() ||
    memo.trim() !== "";
  // 종료를 취소하면 원래 상태로, 원래부터 종료였다면 신규 발견으로 되돌린다
  const reopenTo: LocationStatus = location.status === "CLOSED" ? "NEW" : location.status;
  // 종료 상태에서는 흐름 단계 중 아무것도 선택되지 않는다
  const currentIndex = STATUS_ORDER.indexOf(status);

  const toggle = (a: ActionType) => setActions((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const resolving = status === "RESOLVED" && location.status !== "RESOLVED" && !!onResolve;

  const save = async () => {
    const input = { status, closeReason: closed ? closeReason : undefined, actionTypes: actions, memo };
    if (resolving) return onResolve(input);
    setSaving(true);
    try {
      await onSave(input);
      setMemo("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-5 lg:col-span-3">
        {/* 상태 stepper */}
        <div>
          <p className="mb-2.5 text-sm font-semibold text-slate-600">조치 상태</p>
          <ol className="grid grid-cols-3 gap-1.5">
            {STATUS_ORDER.map((s, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              return (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => setStatus(s)}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full flex-col items-start gap-1.5 rounded-xl px-3.5 py-3 text-left transition-colors",
                      active && "bg-brand-50 ring-2 ring-brand-500 ring-inset",
                      done && "bg-slate-100",
                      !active && !done && "bg-slate-50 hover:bg-slate-100",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
                        active ? "bg-brand-600 text-white" : done ? "bg-slate-400 text-white" : "bg-slate-100 text-slate-400",
                      )}
                    >
                      {done ? <Check className="size-3" /> : i + 1}
                    </span>
                    <span className={cn("text-[15px] font-semibold", active ? "text-brand-700" : "text-slate-700")}>
                      {STATUS_META[s].label}
                    </span>
                    <span className="hidden text-xs text-slate-500 sm:block">{STATUS_META[s].desc}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* 조치 없이 종료 */}
          <div className={cn("mt-2 rounded-xl px-3.5 py-3", closed ? "bg-slate-100 ring-2 ring-slate-400 ring-inset" : "bg-slate-50")}>
            <button
              type="button"
              onClick={() => setStatus(closed ? reopenTo : "CLOSED")}
              aria-pressed={closed}
              className="flex w-full items-center gap-2 text-left text-[15px] font-semibold text-slate-700"
            >
              <XCircle className="size-4 shrink-0 text-slate-400" />
              <span className="whitespace-nowrap">조치 없이 종료</span>
              <span className="ml-auto text-right text-xs font-medium text-slate-500">
                {closed ? "종료 취소" : <span className="hidden sm:inline">잘못 분석됐거나 조치가 필요 없을 때</span>}
              </span>
            </button>
            {closed && (
              <div className="mt-3 grid gap-1.5 sm:grid-cols-3">
                {CLOSE_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCloseReason(r)}
                    aria-pressed={closeReason === r}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-left transition-colors",
                      closeReason === r ? "bg-white ring-2 ring-brand-500 ring-inset" : "bg-white/60 hover:bg-white",
                    )}
                  >
                    <span className="block text-sm font-semibold text-slate-800">{CLOSE_REASON_META[r].label}</span>
                    <span className="block text-xs text-slate-500">{CLOSE_REASON_META[r].desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 조치 유형 */}
        <div className={cn(closed && "hidden")}>
          <p className="mb-2.5 text-sm font-semibold text-slate-600">현장조치</p>
          <div className="grid grid-cols-2 gap-2">
            {ACTION_TYPES.map((a) => {
              const checked = actions.includes(a);
              return (
                <label
                  key={a}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-3 text-[15px] transition-colors",
                    checked ? "bg-brand-50 ring-2 ring-brand-500 ring-inset" : "bg-slate-50 hover:bg-slate-100",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(a)}
                    className="size-4 rounded border-slate-300 accent-brand-600"
                  />
                  <span className="flex-1 font-medium text-slate-800">{ACTION_META[a].label}</span>
                  {recommended.includes(a) && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-800">권장</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="action-memo" className="mb-2.5 block text-sm font-semibold text-slate-600">
            조치 메모
          </label>
          <textarea
            id="action-memo"
            rows={2}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예: 관할 주차단속반에 단속 요청, 공사 업체에 가림막 재설치 요청"
            className={cn(inputClass, "resize-none")}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={!dirty || saving || (closed && !closeReason)} icon={saving ? <Spinner /> : resolving ? <Camera className="size-4" /> : <Save className="size-4" />}>
            {resolving ? "조치 완료 · 현장 사진으로 확인" : "조치 내용 저장"}
          </Button>
        </div>
      </div>

      {/* 조치 이력 */}
      <div className="lg:col-span-2">
        <p className="mb-2.5 text-sm font-semibold text-slate-600">조치 이력</p>
        {logs.length ? (
          <ol className="relative space-y-4 border-l border-slate-200 pl-4">
            {logs.map((log) => (
              <li key={log.id} className="relative">
                <span className={cn("absolute top-1.5 -left-[21px] size-2.5 rounded-full ring-4 ring-white", STATUS_META[log.status].dot)} />
                <div className="flex items-center gap-2">
                  <StatusBadge status={log.status} />
                  {log.closeReason && <span className="text-[13px] font-medium text-slate-600">{CLOSE_REASON_META[log.closeReason].label}</span>}
                  <span className="tabular text-[11px] text-slate-400">{formatDateTime(log.createdAt)}</span>
                </div>
                {log.actionTypes.length > 0 && (
                  <p className="mt-1 text-[13px] font-medium text-slate-700">
                    {log.actionTypes.map((a) => ACTION_META[a].label).join(", ")}
                  </p>
                )}
                {log.memo && <p className="mt-0.5 text-[13px] text-slate-500">{log.memo}</p>}
                <p className="mt-0.5 text-[11px] text-slate-400">{log.createdBy}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-[13px] text-slate-500">아직 기록된 조치가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
