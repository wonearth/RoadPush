"use client";

import { ArrowLeft, CalendarClock, ClipboardCheck, GitCompareArrows, MapPin, ScanSearch } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { LayerToggles } from "@/components/analysis/LayerToggles";
import { ActionManagement } from "@/components/location/ActionManagement";
import { BeforeAfterComparison } from "@/components/location/BeforeAfterComparison";
import { FollowUpAnalysis } from "@/components/location/FollowUpAnalysis";
import { ResolveFlowDialog } from "@/components/location/ResolveFlowDialog";
import { WorkflowProgress } from "@/components/location/WorkflowProgress";
import { DEFAULT_LAYERS } from "@/components/media/AnalysisOverlayLayer";
import { MediaFrame } from "@/components/media/MediaFrame";
import { RiskBadge, StatusBadge } from "@/components/risk/RiskBadge";
import { RiskBar } from "@/components/risk/RiskBar";
import { PassabilityText } from "@/components/risk/PassabilityText";
import { RiskMetrics } from "@/components/risk/RiskMetrics";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { MockBadge } from "@/components/ui/MockNotice";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { CLOSE_REASON_META, RISK_META, STATUS_META, isOpenStatus } from "@/constants/risk";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { describeRisk, formatDateTime } from "@/lib/format";
import { locationService } from "@/services";
import type { AnalysisResult, LocationStatus, UpdateActionInput } from "@/types";

/** 조치상태를 상단 진행 단계로 바꾼다. 조치 완료 후 재분석까지 마쳤으면 모든 단계 완료(4). */
function workflowStage(status: Exclude<LocationStatus, "CLOSED">, hasFollowUp: boolean) {
  if (status === "RESOLVED" && hasFollowUp) return 4;
  return { NEW: 0, ACTION_PLANNED: 1, RESOLVED: 2 }[status];
}

export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  // 조치 완료로 저장하려는 내용 — 사진·재분석 흐름(ResolveFlowDialog)을 거쳐 저장한다
  const [pendingResolve, setPendingResolve] = useState<UpdateActionInput | null>(null);

  const { data, loading, reload } = useAsync(
    () =>
      Promise.all([locationService.get(id), locationService.getAnalysisHistory(id), locationService.getActionLogs(id)]),
    id,
  );

  if (loading && !data) {
    return (
      <div className="space-y-5 px-4 pt-5 pb-10 sm:px-8">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    );
  }

  const [location, history = [], logs = []] = data ?? [];
  if (!location) {
    return (
      <EmptyState
        className="py-24"
        icon={<MapPin className="size-8" />}
        title="구간을 찾을 수 없습니다"
        description="삭제되었거나 존재하지 않는 구간입니다."
        action={<ButtonLink href="/map">위험지도로 이동</ButtonLink>}
      />
    );
  }

  const initial = history.find((r) => r.phase === "INITIAL") ?? history[0];
  const latest = history.at(-1);
  const followUp = history.length > 1 && latest?.phase === "FOLLOW_UP" ? latest : undefined;
  const meta = RISK_META[location.riskLevel];

  const saveAction = async (input: UpdateActionInput) => {
    await locationService.updateAction(location.id, input, user?.name ?? "데모 관리자");
    await reload();
  };

  const completeResolve = async (result: AnalysisResult | null) => {
    if (!pendingResolve) return;
    await locationService.updateAction(location.id, pendingResolve, user?.name ?? "데모 관리자");
    if (result) await locationService.addFollowUpAnalysis(location.id, result);
    setPendingResolve(null);
    await reload();
    if (result) document.getElementById("before-after")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-5 px-4 pt-5 pb-10 sm:px-8">
      {/* 요약 헤더: 위험도 → 위치 → 원인 → 보행공간 → 차도 이탈 → 조치상태 */}
      <Card>
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <Link href="/map" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
              <ArrowLeft className="size-3.5" /> 위험지도
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="text-[26px] font-bold text-slate-900">{location.name}</h2>
              <StatusBadge status={location.status} />
              {location.isSample && <MockBadge label="예시 데이터" />}
            </div>
            <p className="mt-1 flex items-center gap-1 text-[15px] text-slate-500">
              <MapPin className="size-3.5" /> {location.address}
            </p>
            <p className="mt-3 text-base text-slate-700">{describeRisk(location)}</p>
            <div className="mt-4">
              {location.status === "CLOSED" ? (
                <p className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  {location.closeReason ? CLOSE_REASON_META[location.closeReason].label : "종료"} · 조치 없이 종료된 구간
                </p>
              ) : (
                <WorkflowProgress current={workflowStage(location.status, Boolean(followUp))} />
              )}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-7 py-5 lg:min-w-64">
            <p className="text-[15px] text-slate-500">보행공간 단절 위험도</p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className={`tabular text-5xl font-extrabold tracking-tight ${meta.text}`}>{location.riskScore}</span>
              <span className="text-base text-slate-500">/ 100</span>
              <RiskBadge level={location.riskLevel} className="ml-1 text-lg" />
            </p>
            <RiskBar score={location.riskScore} level={location.riskLevel} className="mt-3 w-full bg-white" />
            <PassabilityText value={location} detail className="mt-4 max-w-72 text-[15px]" />
          </div>
        </div>
      </Card>

      {/* 분석 결과 */}
      {latest && (
        <Card>
          <CardHeader
            title={followUp ? "최근 분석 결과 (재분석)" : "AI 분석 결과"}
            description="원본 이미지와 보행공간 분석 결과를 비교합니다"
            action={
              <ButtonLink href={`/map?selected=${location.id}`} variant="secondary" size="sm" icon={<MapPin className="size-3.5" />}>
                지도에서 보기
              </ButtonLink>
            }
          />
          <CardBody className="grid gap-6 xl:grid-cols-12">
            <div className="space-y-3 xl:col-span-8">
              <div className="grid gap-3 md:grid-cols-2">
                <MediaFrame variant="original" src={latest.originalImageUrl} videoSrc={latest.originalVideoUrl} overlay={latest.overlay} label="원본 이미지" />
                <MediaFrame
                  variant="result"
                  src={latest.originalImageUrl}
                  resultSrc={latest.resultImageUrl}
                  overlay={latest.overlay}
                  layers={layers}
                  walkableRatio={latest.walkableRatio}
                  roadDetourRequired={latest.roadDetourRequired}
                  label="AI 분석 결과"
                />
              </div>
              <LayerToggles layers={layers} onChange={setLayers} />
            </div>
            <div className="xl:col-span-4">
              <RiskMetrics
                metrics={location}
                extra={
                  <>
                    <div className="flex items-center justify-between py-3 text-[13px]">
                      <dt className="flex items-center gap-1.5 text-slate-500">
                        <CalendarClock className="size-3.5" /> 분석 일시
                      </dt>
                      <dd className="tabular font-medium text-slate-800">{formatDateTime(location.analyzedAt)}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4 py-3 text-[13px]">
                      <dt className="flex shrink-0 items-center gap-1.5 text-slate-500">
                        <MapPin className="size-3.5" /> 위치
                      </dt>
                      <dd className="text-right font-medium text-slate-800">
                        {location.address}
                        <span className="tabular mt-0.5 block text-[11px] font-normal text-slate-400">
                          {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                        </span>
                      </dd>
                    </div>
                  </>
                }
              />
            </div>
          </CardBody>
        </Card>
      )}

      {/* 현장조치 관리 */}
      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <ClipboardCheck className="size-4 text-brand-600" /> 현장조치 관리
            </span>
          }
          description="신규 발견 → 조치 예정 → 조치 완료 순으로 관리하고, 조치가 필요 없으면 종료합니다"
        />
        <CardBody>
          <ActionManagement
            key={`${location.status}-${location.closeReason}-${location.plannedActions.join()}`}
            location={location}
            logs={logs}
            recommendFrom={initial?.obstacleTypes ?? location.obstacleTypes}
            onSave={saveAction}
            onResolve={setPendingResolve}
          />
        </CardBody>
      </Card>

      <ResolveFlowDialog
        open={!!pendingResolve}
        locationId={location.id}
        before={location}
        baseline={initial}
        onClose={() => setPendingResolve(null)}
        onSubmit={completeResolve}
      />

      {/* 조치 전·후 비교 */}
      <Card id="before-after" className="scroll-mt-4">
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <GitCompareArrows className="size-4 text-brand-600" /> 조치 전 / 조치 후 비교
            </span>
          }
          description="현장조치 후 동일 구간을 재분석해 실제 개선효과를 확인합니다"
          action={
            followUp && (
              <FollowUpAnalysis
                compact
                locationId={location.id}
                baseline={initial}
                onComplete={async (r) => {
                  await locationService.addFollowUpAnalysis(location.id, r);
                  await reload();
                }}
              />
            )
          }
        />
        <CardBody>
          {initial && followUp ? (
            <BeforeAfterComparison before={initial} after={followUp} />
          ) : (
            <div className="grid gap-6 rounded-2xl bg-slate-50 p-6 lg:grid-cols-2">
              <div>
                <ScanSearch className="size-6 text-slate-400" />
                <p className="mt-3 text-sm font-semibold text-slate-900">아직 조치 후 재분석 결과가 없습니다</p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                  현장조치를 완료한 뒤 같은 구간을 다시 촬영해 분석하면, 위험도와 유효 보행공간의 변화를 조치 전과 비교해 보여줍니다.
                </p>
                {isOpenStatus(location.status) && (
                  <p className="mt-3 text-[13px] font-medium text-amber-700">
                    현재 상태는 &lsquo;{STATUS_META[location.status].label}&rsquo;입니다. 현장조치 관리에서 &lsquo;조치 완료&rsquo;를 고르면 사진 촬영과 재분석이 바로 이어집니다.
                  </p>
                )}
              </div>
              <FollowUpAnalysis
                camera
                locationId={location.id}
                baseline={initial}
                onComplete={async (r) => {
                  await locationService.addFollowUpAnalysis(location.id, r);
                  await reload();
                }}
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
