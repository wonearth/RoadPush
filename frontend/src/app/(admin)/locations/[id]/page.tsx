"use client";

import { ArrowLeft, CalendarClock, ClipboardCheck, GitCompareArrows, MapPin, ScanSearch } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { LayerToggles } from "@/components/analysis/LayerToggles";
import { ActionManagement } from "@/components/location/ActionManagement";
import { BeforeAfterComparison } from "@/components/location/BeforeAfterComparison";
import { FollowUpAnalysis } from "@/components/location/FollowUpAnalysis";
import { WorkflowProgress } from "@/components/location/WorkflowProgress";
import { DEFAULT_LAYERS } from "@/components/media/AnalysisOverlayLayer";
import { MediaFrame } from "@/components/media/MediaFrame";
import { RiskBadge, StatusBadge } from "@/components/risk/RiskBadge";
import { RiskBar } from "@/components/risk/RiskBar";
import { RiskMetrics } from "@/components/risk/RiskMetrics";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { MockBadge } from "@/components/ui/MockNotice";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { RISK_META, STATUS_META } from "@/constants/risk";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { describeRisk, formatDateTime } from "@/lib/format";
import { locationService } from "@/services";
import type { LocationStatus } from "@/types";

function workflowStage(status: LocationStatus, hasFollowUp: boolean) {
  if (hasFollowUp) return 4;
  return { NEW: 0, REVIEW_REQUIRED: 1, ACTION_PLANNED: 2, RESOLVED: 3 }[status];
}

export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [layers, setLayers] = useState(DEFAULT_LAYERS);

  const { data, loading, reload } = useAsync(
    () =>
      Promise.all([locationService.get(id), locationService.getAnalysisHistory(id), locationService.getActionLogs(id)]),
    id,
  );

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-[1360px] space-y-5 p-4 sm:p-6">
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

  const saveAction = async (input: Parameters<typeof locationService.updateAction>[1]) => {
    await locationService.updateAction(location.id, input, user?.name ?? "데모 관리자");
    await reload();
  };

  return (
    <div className="mx-auto max-w-[1360px] space-y-5 p-4 sm:p-6">
      {/* 요약 헤더: 위험도 → 위치 → 원인 → 보행공간 → 차도 이탈 → 조치상태 */}
      <Card className="overflow-hidden">
        <div className="h-1" style={{ backgroundColor: meta.hex }} />
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <Link href="/map" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800">
              <ArrowLeft className="size-3.5" /> 위험지도
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">{location.name}</h2>
              <StatusBadge status={location.status} />
              {location.isSample && <MockBadge label="예시 데이터" />}
            </div>
            <p className="mt-1 flex items-center gap-1 text-[13px] text-slate-500">
              <MapPin className="size-3.5" /> {location.address}
            </p>
            <p className="mt-3 text-sm text-slate-700">{describeRisk(location)}</p>
            <div className="mt-4">
              <WorkflowProgress current={workflowStage(location.status, Boolean(followUp))} />
            </div>
          </div>
          <div className={`flex items-center gap-5 rounded-xl border px-6 py-4 ${meta.border} ${meta.softBg}`}>
            <div>
              <p className="text-xs font-semibold text-slate-500">보행공간 단절 위험도</p>
              <p className="mt-1 flex items-baseline gap-1">
                <span className={`tabular text-5xl font-bold tracking-tight ${meta.text}`}>{location.riskScore}</span>
                <span className="text-sm text-slate-400">/ 100</span>
              </p>
              <RiskBar score={location.riskScore} level={location.riskLevel} className="mt-2 w-40 bg-white" />
            </div>
            <RiskBadge level={location.riskLevel} className="px-3 py-1.5 text-base" />
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
          description="확인 → 조치 예정 → 조치 완료 순으로 상태를 관리하고 조치 내용을 기록합니다"
        />
        <CardBody>
          <ActionManagement
            key={`${location.status}-${location.plannedActions.join()}`}
            location={location}
            logs={logs}
            recommendFrom={initial?.obstacleTypes ?? location.obstacleTypes}
            onSave={saveAction}
          />
        </CardBody>
      </Card>

      {/* 조치 전·후 비교 */}
      <Card>
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
            <div className="grid gap-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-6 lg:grid-cols-2">
              <div>
                <ScanSearch className="size-6 text-slate-400" />
                <p className="mt-3 text-sm font-semibold text-slate-900">아직 조치 후 재분석 결과가 없습니다</p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                  현장조치를 완료한 뒤 같은 구간을 다시 촬영해 분석하면, 위험도와 유효 보행공간의 변화를 조치 전과 비교해 보여줍니다.
                </p>
                {location.status !== "RESOLVED" && (
                  <p className="mt-3 text-[13px] font-medium text-amber-700">
                    현재 상태는 &lsquo;{STATUS_META[location.status].label}&rsquo;입니다. 조치 완료 후 재분석을 권장합니다.
                  </p>
                )}
              </div>
              <FollowUpAnalysis
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
