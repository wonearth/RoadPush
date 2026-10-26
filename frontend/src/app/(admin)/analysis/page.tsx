"use client";

import { ArrowDown, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnalysisProgress, ANALYSIS_STEPS } from "@/components/analysis/AnalysisProgress";
import { LayerToggles } from "@/components/analysis/LayerToggles";
import { RegisterLocationDialog } from "@/components/analysis/RegisterLocationDialog";
import { UploadDropzone } from "@/components/analysis/UploadDropzone";
import { DEFAULT_LAYERS } from "@/components/media/AnalysisOverlayLayer";
import { MediaFrame } from "@/components/media/MediaFrame";
import { RiskBadge } from "@/components/risk/RiskBadge";
import { RiskGauge } from "@/components/risk/RiskGauge";
import { PassabilityText } from "@/components/risk/PassabilityText";
import { RiskMetrics } from "@/components/risk/RiskMetrics";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { MockBadge } from "@/components/ui/MockNotice";
import { Spinner } from "@/components/ui/States";
import { MOCK_SAMPLE_OVERLAY, MOCK_SAMPLE_SCENE_URL } from "@/mocks/mockOverlay";
import { analysisService, storageService, type UploadedMedia } from "@/services";
import type { AnalysisResult } from "@/types";

type Phase = "idle" | "ready" | "analyzing" | "done";

export default function AnalysisPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [media, setMedia] = useState<UploadedMedia | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [registerOpen, setRegisterOpen] = useState(false);

  const isSample = media?.imageUrl === MOCK_SAMPLE_SCENE_URL;

  const onFile = async (f: File) => {
    setPreparing(true);
    setError(null);
    try {
      setMedia(await storageService.uploadAnalysisMedia(f));
      setFile(f);
      setPhase("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "파일을 불러오지 못했습니다.");
    } finally {
      setPreparing(false);
    }
  };

  const useSample = () => {
    setFile(null);
    setMedia({ mediaType: "image", imageUrl: MOCK_SAMPLE_SCENE_URL });
    setPhase("ready");
  };

  const reset = () => {
    setPhase("idle");
    setFile(null);
    setMedia(null);
    setResult(null);
    setStep(0);
  };

  const runAnalysis = async () => {
    if (!media) return;
    setPhase("analyzing");
    setStep(0);
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1)), 520);
    try {
      const r = await analysisService.analyze({
        file,
        mediaType: media.mediaType,
        originalImageUrl: media.imageUrl,
        originalVideoUrl: media.videoUrl,
      });
      setResult(r);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석에 실패했습니다.");
      setPhase("ready");
    } finally {
      clearInterval(timer);
    }
  };

  return (
    <div className="space-y-5 px-4 pt-5 pb-10 sm:px-8">
      {/* 업로드 */}
      {phase === "idle" && (
        <Card>
          <CardHeader
            title="영상·사진 업로드"
            action={<MockBadge label="AI 연동 전 · 예시 분석" />}
          />
          <CardBody className="space-y-4">
            <UploadDropzone onFile={onFile} disabled={preparing} />
            {preparing && (
              <p className="flex items-center gap-2 text-[13px] text-slate-500">
                <Spinner /> 파일을 불러오는 중…
              </p>
            )}
            {error && <p className="text-xs font-medium text-red-600">{error}</p>}
            <div className="flex flex-col items-start justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3 sm:flex-row sm:items-center">
              <p className="text-[13px] text-slate-600">촬영본이 없으면 예시 장면으로 분석할 수 있습니다.</p>
              <Button variant="secondary" size="sm" onClick={useSample}>
                예시 장면으로 분석
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {phase !== "idle" && media && (
        <div className="grid gap-5 xl:grid-cols-12">
          {/* 원본 → AI 결과 */}
          <Card className="xl:col-span-7">
            <CardHeader
              title={phase === "done" ? "원본 및 AI 분석 결과" : "분석 대상"}
              description={
                file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)}MB` : isSample ? "예시 장면" : undefined
              }
              action={
                phase !== "analyzing" && (
                  <Button variant="ghost" size="sm" icon={phase === "done" ? <RotateCcw className="size-3.5" /> : <Trash2 className="size-3.5" />} onClick={reset}>
                    {phase === "done" ? "새 분석" : "다시 선택"}
                  </Button>
                )
              }
            />
            <CardBody className="space-y-3">
              <MediaFrame
                variant="original"
                src={media.imageUrl}
                videoSrc={media.videoUrl}
                overlay={isSample ? MOCK_SAMPLE_OVERLAY : (result?.overlay ?? null)}
                label={media.mediaType === "video" ? "원본 영상" : "원본 이미지"}
              />
              {phase === "done" && result ? (
                <>
                  <div className="flex justify-center text-slate-300">
                    <ArrowDown className="size-5" />
                  </div>
                  <MediaFrame
                    variant="result"
                    src={result.originalImageUrl}
                    resultSrc={result.resultImageUrl}
                    overlay={result.overlay}
                    layers={layers}
                    walkableRatio={result.walkableRatio}
                    roadDetourRequired={result.roadDetourRequired}
                    label={media.mediaType === "video" ? "AI 분석 결과 (대표 프레임)" : "AI 분석 결과"}
                  />
                  <LayerToggles layers={layers} onChange={setLayers} />
                  {!isSample && (
                    <p className="text-[11px] text-slate-400">
                      현재 overlay 는 mock 서비스가 만든 예시 위치이며 업로드한 이미지의 실제 내용과 무관합니다.
                    </p>
                  )}
                </>
              ) : null}
            </CardBody>
          </Card>

          {/* 분석 실행 / 결과 */}
          <div className="space-y-5 xl:col-span-5">
            {phase === "ready" && (
              <Card>
                <CardHeader title="AI 분석" />
                <CardBody className="space-y-5">
                  <AnalysisProgress current={-1} />
                  {error && <p className="text-xs font-medium text-red-600">{error}</p>}
                  <Button size="lg" className="w-full" onClick={runAnalysis}>
                    AI 분석 시작
                  </Button>
                </CardBody>
              </Card>
            )}

            {phase === "analyzing" && (
              <Card>
                <CardHeader title="분석 중…" />
                <CardBody>
                  <AnalysisProgress current={step} />
                </CardBody>
              </Card>
            )}

            {phase === "done" && result && (
              <>
                <Card>
                  <CardHeader title="보행공간 단절 위험도" action={<MockBadge label="예시 결과" />} />
                  <CardBody className="flex flex-col items-center pt-2">
                    <RiskGauge score={result.riskScore} level={result.riskLevel} />
                    <RiskBadge level={result.riskLevel} className="mt-1 px-2.5 py-1 text-sm" />
                    {/* 통행 판단 한 곳에만 설명을 둔다 (원인·잠식률은 아래 판단 근거에 있다) */}
                    <PassabilityText value={result} detail className="mt-4 w-full rounded-xl bg-slate-50 px-4 py-3 text-center text-base" />
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader title="판단 근거" />
                  <CardBody className="pt-3 pb-1">
                    <RiskMetrics metrics={result} />
                  </CardBody>
                </Card>
                <Card className="border-brand-200 bg-brand-50/40 p-5">
                  <p className="text-[13px] text-slate-600">등록한 구간은 위험지도와 현장조치 관리 대상에 포함됩니다.</p>
                  <Button
                    size="lg"
                    className="mt-4 w-full"
                   
                    onClick={() => setRegisterOpen(true)}
                  >
                    위험구간으로 등록
                  </Button>
                </Card>
                <RegisterLocationDialog
                  open={registerOpen}
                  onClose={() => setRegisterOpen(false)}
                  analysis={result}
                  onRegistered={(loc) => router.push(`/locations/${loc.id}`)}
                />
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
