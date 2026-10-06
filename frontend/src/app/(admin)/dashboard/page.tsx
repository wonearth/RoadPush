"use client";

import { AlertTriangle, ArrowRight, Gauge, Route, ScanSearch, ShieldAlert, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyDashboard } from "@/components/dashboard/EmptyDashboard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PriorityList } from "@/components/dashboard/PriorityList";
import { RiskMap } from "@/components/map/RiskMap";
import { ObstacleTags } from "@/components/risk/ObstacleTags";
import { RiskBadge, StatusBadge } from "@/components/risk/RiskBadge";
import { RiskDistribution } from "@/components/risk/RiskDistribution";
import { RiskLegend } from "@/components/risk/RiskLegend";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { RISK_META, getRiskLevel } from "@/constants/risk";
import { useAsync } from "@/hooks/useAsync";
import { formatDateTime } from "@/lib/format";
import { locationService } from "@/services";

export default function DashboardPage() {
  const router = useRouter();
  const { data, loading, reload } = useAsync(
    () => Promise.all([locationService.getDashboardSummary(), locationService.list({ sort: "risk-desc" })]),
    "dashboard",
  );
  const [summary, locations = []] = data ?? [];
  const priority = locations.filter((l) => l.status !== "RESOLVED" && l.riskLevel !== "SAFE").slice(0, 6);
  const recent = [...locations].sort((a, b) => b.analyzedAt.localeCompare(a.analyzedAt)).slice(0, 4);
  const avgLevel = summary ? getRiskLevel(summary.averageRiskScore) : "SAFE";
  const top = priority[0];

  if (summary && summary.totalCount === 0) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyDashboard onSeeded={reload} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1360px] space-y-5 p-4 sm:p-6">
      {/* 오늘의 최우선 점검 구간 */}
      {top && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50/60 px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-start gap-3">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                가장 먼저 점검할 구간: <span className="text-red-700">{top.name}</span>{" "}
                <span className="tabular">({top.riskScore}점 · {RISK_META[top.riskLevel].label})</span>
              </p>
              <p className="mt-0.5 text-[13px] text-slate-600">
                {top.address} · 유효 보행공간 {Math.round(top.walkableRatio * 100)}%
                {top.roadDetourRequired && " · 보행자 차도 우회 발생"}
              </p>
            </div>
          </div>
          <ButtonLink href={`/locations/${top.id}`} size="sm" icon={<ArrowRight className="size-3.5" />} className="flex-row-reverse">
            상세 확인
          </ButtonLink>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {summary ? (
          <>
            <KpiCard label="전체 분석 구간" value={summary.totalCount} unit="개" icon={<Route className="size-4" />} hint={`${new Set(locations.map((l) => l.area)).size}개 생활권`} />
            <KpiCard
              label="발견된 단절구간"
              value={summary.disconnectedCount}
              unit="개"
              icon={<AlertTriangle className="size-4" />}
              accent="bg-orange-50 text-orange-600"
              hint="위험도 26점 이상 (주의~위험)"
            />
            <KpiCard
              label="고위험 구간"
              value={summary.highRiskCount}
              unit="개"
              icon={<ShieldAlert className="size-4" />}
              accent="bg-red-50 text-red-600"
              hint="위험도 76점 이상"
            />
            <KpiCard
              label="평균 단절 위험도"
              value={<span className={RISK_META[avgLevel].text}>{summary.averageRiskScore}</span>}
              unit="/ 100"
              icon={<Gauge className="size-4" />}
              hint={<RiskBadge level={avgLevel} />}
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[126px] rounded-xl" />)
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        {/* 우선점검 필요 구간 */}
        <Card className="min-w-0 xl:col-span-8">
          <CardHeader
            title="우선점검 필요 구간"
            description="조치가 완료되지 않은 단절구간을 위험도 높은 순으로 표시합니다"
            action={
              <ButtonLink href="/map" variant="ghost" size="sm">
                전체 보기 <ArrowRight className="size-3.5" />
              </ButtonLink>
            }
          />
          <div className="mt-3">
            {loading ? (
              <div className="space-y-2 p-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : priority.length ? (
              <PriorityList locations={priority} />
            ) : (
              <EmptyState title="우선점검이 필요한 구간이 없습니다" description="모든 단절구간의 조치가 완료되었습니다." />
            )}
          </div>
        </Card>

        <div className="min-w-0 space-y-5 xl:col-span-4">
          <Card>
            <CardHeader
              title="위험지도"
              action={
                <Link href="/map" className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600 hover:text-brand-700">
                  <MapIcon className="size-3.5" /> 지도에서 보기
                </Link>
              }
            />
            <CardBody className="pt-3">
              <button
                type="button"
                onClick={() => router.push("/map")}
                className="block w-full overflow-hidden rounded-lg ring-1 ring-slate-200 transition hover:ring-brand-300"
                aria-label="위험지도로 이동"
              >
                <RiskMap locations={locations} interactive={false} className="aspect-[16/10] w-full" />
              </button>
              <RiskLegend compact className="mt-3" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="위험도 단계별 분포" />
            <CardBody className="pt-4">
              {summary ? <RiskDistribution distribution={summary.distribution} /> : <Skeleton className="h-32" />}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* 최근 분석 구간 */}
      <Card>
        <CardHeader
          title="최근 분석 구간"
          action={
            <ButtonLink href="/analysis" variant="secondary" size="sm" icon={<ScanSearch className="size-3.5" />}>
              새 분석
            </ButtonLink>
          }
        />
        <CardBody className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {recent.map((loc) => (
            <Link
              key={loc.id}
              href={`/locations/${loc.id}`}
              className="rounded-lg border border-slate-200 p-4 transition hover:border-brand-300 hover:bg-brand-50/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">{loc.name}</span>
                <span className={`tabular text-lg font-bold ${RISK_META[loc.riskLevel].text}`}>{loc.riskScore}</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(loc.analyzedAt)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <RiskBadge level={loc.riskLevel} />
                <StatusBadge status={loc.status} />
              </div>
              <ObstacleTags types={loc.obstacleTypes} size="sm" className="mt-2" />
            </Link>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
