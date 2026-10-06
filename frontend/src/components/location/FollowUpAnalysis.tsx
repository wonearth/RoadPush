"use client";

import { RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { analysisService, storageService, type UploadedMedia } from "@/services";
import type { AnalysisResult } from "@/types";
import { UploadDropzone } from "../analysis/UploadDropzone";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/States";

/**
 * 동일 구간 재분석. 현장조치 후 다시 촬영한 영상을 분석해 개선 여부를 확인한다.
 * (mock: 파일이 없으면 개발용 예시 장면으로 재분석 결과를 만든다)
 */
export function FollowUpAnalysis({
  locationId,
  baseline,
  onComplete,
  compact = false,
}: {
  locationId: string;
  /** 최초 분석 결과 (조치 전) */
  baseline?: { riskScore: number; walkableRatio: number };
  onComplete: (result: AnalysisResult) => Promise<void>;
  compact?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [media, setMedia] = useState<UploadedMedia | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const result = await analysisService.analyze({
        file,
        locationId,
        baseline,
        mediaType: media?.mediaType ?? "image",
        originalImageUrl: media?.imageUrl ?? `mock://scene/${locationId}/followup-${Date.now()}`,
        originalVideoUrl: media?.videoUrl,
      });
      await onComplete(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "재분석에 실패했습니다.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-3">
      {!compact &&
        (file ? (
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px]">
            <span className="truncate font-medium text-slate-700">{file.name}</span>
            <button
              type="button"
              onClick={() => (setFile(null), setMedia(null))}
              className="rounded p-1 text-slate-400 hover:bg-slate-200"
              aria-label="파일 제거"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <UploadDropzone
            compact
            disabled={running}
            onFile={async (f) => {
              setMedia(await storageService.uploadAnalysisMedia(f));
              setFile(f);
            }}
          />
        ))}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      <Button
        onClick={run}
        disabled={running}
        variant={compact ? "secondary" : "primary"}
        size={compact ? "sm" : "md"}
        icon={running ? <Spinner /> : <RefreshCw className="size-4" />}
        className={compact ? undefined : "w-full"}
      >
        {running ? "재분석 중…" : file ? "업로드한 영상으로 재분석" : compact ? "재분석 다시 실행" : "조치 후 재분석 실행 (예시 장면)"}
      </Button>
    </div>
  );
}
