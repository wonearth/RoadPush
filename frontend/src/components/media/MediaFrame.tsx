"use client";

import { isMockMediaUrl } from "@/lib/scene";
import { cn } from "@/lib/cn";
import type { AnalysisOverlay } from "@/types";
import { AnalysisOverlayLayer, DEFAULT_LAYERS, type OverlayLayers } from "./AnalysisOverlayLayer";
import { SceneIllustration } from "./SceneIllustration";

interface MediaFrameProps {
  /** 원본 이미지(또는 영상 대표 프레임) URL. mock:// 이면 개발용 일러스트로 그린다. */
  src: string;
  /** 원본 영상 URL (variant="original" 에서만 재생) */
  videoSrc?: string;
  /** AI 가 생성한 결과 이미지. 있으면 overlay 대신 그대로 보여준다. */
  resultSrc?: string;
  overlay: AnalysisOverlay | null;
  variant: "original" | "result";
  layers?: OverlayLayers;
  walkableRatio?: number;
  roadDetourRequired?: boolean;
  label?: string;
  className?: string;
}

/**
 * 원본 / AI 분석 결과 이미지를 같은 비율(16:10)로 보여주는 프레임.
 * 결과 이미지가 아직 없으면 원본 위에 overlay(segmentation, bbox, 유효 보행공간)를 그린다.
 */
export function MediaFrame({
  src,
  videoSrc,
  resultSrc,
  overlay,
  variant,
  layers = DEFAULT_LAYERS,
  walkableRatio,
  roadDetourRequired,
  label,
  className,
}: MediaFrameProps) {
  const isResult = variant === "result";
  const useServerResult = isResult && resultSrc && !isMockMediaUrl(resultSrc);
  const isMockScene = isMockMediaUrl(src);

  return (
    <figure className={cn("relative aspect-[16/10] overflow-hidden rounded-lg bg-slate-200", className)}>
      {useServerResult ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resultSrc} alt="AI 분석 결과" className="size-full object-cover" />
      ) : isMockScene ? (
        <SceneIllustration
          detections={overlay?.detections ?? []}
          className={cn("size-full", isResult && "saturate-[0.35] brightness-95")}
        />
      ) : !isResult && videoSrc ? (
        <video src={videoSrc} poster={src} controls className="size-full bg-black object-contain" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={isResult ? "AI 분석 결과" : "원본 이미지"}
          className={cn("size-full object-cover", isResult && "saturate-[0.35] brightness-95")}
        />
      )}

      {isResult && !useServerResult && overlay && (
        <AnalysisOverlayLayer
          overlay={overlay}
          layers={layers}
          walkableRatio={walkableRatio}
          roadDetourRequired={roadDetourRequired}
        />
      )}

      {label && (
        <figcaption className="absolute top-2.5 left-2.5 rounded-md bg-slate-900/75 px-2 py-1 text-[11px] font-semibold text-white">
          {label}
        </figcaption>
      )}
      {(isMockScene || (isResult && !useServerResult)) && (
        <span className="absolute right-2.5 bottom-2.5 rounded bg-white/85 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
          {isMockScene ? "예시 이미지" : "예시 결과 · AI 연동 전"}
        </span>
      )}
    </figure>
  );
}
