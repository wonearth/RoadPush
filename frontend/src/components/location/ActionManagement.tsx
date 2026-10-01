"use client";

import { Check, Save } from "lucide-react";
import { useState } from "react";
import { ACTION_META, ACTION_TYPES, STATUS_META, STATUS_ORDER, getRecommendedActions } from "@/constants/risk";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import type { ActionLog, ActionType, Location, LocationStatus, UpdateActionInput } from "@/types";
import { StatusBadge } from "../risk/RiskBadge";
import { Button } from "../ui/Button";
import { inputClass } from "../ui/Field";
import { Spinner } from "../ui/States";

export function ActionManagement({
  location,
  logs,
  recommendFrom,
  onSave,
}: {
  location: Location;
  logs: ActionLog[];
  /** 권장 조치를 계산할 장애요인 (최초 분석 기준) */
  recommendFrom: Location["obstacleTypes"];
  onSave: (input: UpdateActionInput) => Promise<void>;
}) {
  const [status, setStatus] = useState<LocationStatus>(location.status);
  const [actions, setActions] = useState<ActionType[]>(location.plannedActions);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const recommended = getRecommendedActions(recommendFrom);
  const dirty = status !== location.status || actions.join() !== location.plannedActions.join() || memo.trim() !== "";
  const currentIndex = STATUS_ORDER.indexOf(status);

  const toggle = (a: ActionType) => setActions((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ status, actionTypes: actions, memo });
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
          <p className="mb-2 text-xs font-semibold text-slate-500">조치 상태</p>
          <ol className="grid grid-cols-4 gap-1.5">
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
                      "flex w-full flex-col items-start gap-1.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                      active && "border-brand-500 bg-brand-50 ring-1 ring-brand-500",
                      done && "border-slate-200 bg-slate-50",
                      !active && !done && "border-slate-200 bg-white hover:bg-slate-50",
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
                    <span className={cn("text-[13px] font-semibold", active ? "text-brand-700" : "text-slate-600")}>
                      {STATUS_META[s].label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* 조치 유형 */}
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-500">현장조치</p>
          <div className="grid grid-cols-2 gap-2">
            {ACTION_TYPES.map((a) => {
              const checked = actions.includes(a);
              return (
                <label
                  key={a}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] transition-colors",
                    checked ? "border-brand-300 bg-brand-50/60" : "border-slate-200 hover:bg-slate-50",
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
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">권장</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="action-memo" className="mb-2 block text-xs font-semibold text-slate-500">
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
          <Button onClick={save} disabled={!dirty || saving} icon={saving ? <Spinner /> : <Save className="size-4" />}>
            조치 내용 저장
          </Button>
        </div>
      </div>

      {/* 조치 이력 */}
      <div className="lg:col-span-2">
        <p className="mb-2 text-xs font-semibold text-slate-500">조치 이력</p>
        {logs.length ? (
          <ol className="relative space-y-4 border-l border-slate-200 pl-4">
            {logs.map((log) => (
              <li key={log.id} className="relative">
                <span className={cn("absolute top-1.5 -left-[21px] size-2.5 rounded-full ring-4 ring-white", STATUS_META[log.status].dot)} />
                <div className="flex items-center gap-2">
                  <StatusBadge status={log.status} />
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
