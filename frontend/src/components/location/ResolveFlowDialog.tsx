"use client";

import { ArrowRight, Camera, GitCompareArrows, RotateCcw } from "lucide-react";
import { useState } from "react";
import { PASSABILITY_META, RISK_META, getPassability } from "@/constants/risk";
import { formatPercent } from "@/lib/format";
import type { AnalysisResult, RiskLevel } from "@/types";
import { RiskBadge } from "../risk/RiskBadge";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Spinner } from "../ui/States";
import { FollowUpAnalysis } from "./FollowUpAnalysis";

type Snapshot = { riskScore: number; riskLevel: RiskLevel; walkableRatio: number; roadDetourRequired: boolean };

function ScoreBox({ title, value }: { title: string; value: Snapshot }) {
  return (
    <div className="flex-1 rounded-2xl bg-slate-50 px-5 py-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className={`tabular text-4xl font-extrabold tracking-tight ${RISK_META[value.riskLevel].text}`}>{value.riskScore}</span>
        <RiskBadge level={value.riskLevel} />
      </p>
      <p className="mt-2 text-sm text-slate-600">
        보행공간 {formatPercent(value.walkableRatio)} · <b className="font-semibold">{PASSABILITY_META[getPassability(value)].label}</b>
      </p>
    </div>
  );
}

/**
 * 조치 완료 흐름 — 조치 후 현장 사진 촬영 → 재분석 → 전후 비교를 한 번에 진행한다.
 * 재분석 결과는 '저장' 전까지 미리보기로만 보여주고, 저장할 때 조치 완료와 함께 기록한다.
 */
export function ResolveFlowDialog({
  open,
  locationId,
  before,
  baseline,
  onClose,
  onSubmit,
}: {
  open: boolean;
  locationId: string;
  /** 조치 전(현재) 상태 */
  before: Snapshot;
  /** 최초 분석 결과 — 재분석 기준 */
  baseline?: { riskScore: number; walkableRatio: number };
  onClose: () => void;
  /** result 가 null 이면 사진 없이 조치 완료만 저장한다 */
  onSubmit: (result: AnalysisResult | null) => Promise<void>;
}) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saving, setSaving] = useState<"with" | "without" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (r: AnalysisResult | null) => {
    setSaving(r ? "with" : "without");
    setError(null);
    try {
      await onSubmit(r);
      setResult(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(null);
    }
  };

  const drop = result ? before.riskScore - result.riskScore : 0;

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      size="lg"
      title="조치 완료 확인"
      description="조치 후 현장 사진을 다시 분석해 실제로 나아졌는지 확인합니다"
    >
      <ol className="mb-4 flex items-center gap-2 text-xs font-semibold">
        {["사진 촬영", "재분석", "전후 비교"].map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span className={result || i === 0 ? "text-brand-700" : "text-slate-400"}>
              {i + 1}. {label}
            </span>
            {i < 2 && <ArrowRight className="size-3 text-slate-300" />}
          </li>
        ))}
      </ol>

      {result ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ScoreBox title="조치 전" value={before} />
            <ArrowRight className="mx-auto size-5 rotate-90 text-slate-400 sm:rotate-0" />
            <ScoreBox title="조치 후" value={result} />
          </div>
          <p className="rounded-xl bg-brand-50 px-4 py-3 text-[15px] font-medium text-brand-800">
            {drop > 0 ? `위험도가 ${drop}점 낮아졌어요.` : drop < 0 ? `위험도가 ${-drop}점 높아졌어요. 현장을 다시 확인해 주세요.` : "위험도 변화가 없어요."}
          </p>
          <button
            type="button"
            onClick={() => setResult(null)}
            disabled={!!saving}
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            <RotateCcw className="size-3.5" /> 다시 촬영
          </button>
        </div>
      ) : (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <Camera className="size-4 text-brand-600" /> 조치한 곳을 같은 위치·방향에서 찍어 주세요
          </p>
          <FollowUpAnalysis camera locationId={locationId} baseline={baseline} onComplete={async (r) => setResult(r)} />
        </div>
      )}

      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => submit(null)}
          disabled={!!saving}
          className="inline-flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          {saving === "without" && <Spinner />} 사진 없이 조치 완료만 저장
        </button>
        <Button
          onClick={() => result && submit(result)}
          disabled={!result || !!saving}
          icon={saving === "with" ? <Spinner /> : <GitCompareArrows className="size-4" />}
        >
          저장하고 전후 비교 보기
        </Button>
      </div>
    </Dialog>
  );
}
