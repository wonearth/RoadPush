"use client";

import { useState } from "react";
import { analyzePendingLocation } from "@/services/analysis/analyzePendingLocation";
import { isAiConnected } from "@/services";
import type { Location } from "@/types";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/States";

/** AI 분석 대기 구간의 현장 사진을 AI 서버로 분석한다 */
export function PendingAnalyzeButton({ location, onDone }: { location: Location; onDone: () => Promise<void> | void }) {
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    try {
      await analyzePendingLocation(location, (done, total) => setProgress(`사진 분석 중 (${Math.min(done + 1, total)}/${total})`));
      await onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석에 실패했습니다.");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="mt-4">
      <Button onClick={run} disabled={!isAiConnected || !!progress} icon={progress ? <Spinner /> : undefined}>
        {progress ?? "AI 분석"}
      </Button>
      <p className={error ? "mt-1.5 text-xs font-medium text-red-600" : "mt-1.5 text-xs text-slate-400"}>
        {error ??
          (isAiConnected
            ? `현장 사진 ${location.photos?.length ?? 0}장을 분석해 가장 위험한 사진의 결과를 구간 위험도로 씁니다.`
            : "AI 모델 연결 후 사용할 수 있습니다")}
      </p>
    </div>
  );
}
