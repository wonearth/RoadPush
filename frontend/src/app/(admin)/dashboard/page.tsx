"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyDashboard } from "@/components/dashboard/EmptyDashboard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PriorityList } from "@/components/dashboard/PriorityList";
import { RiskMap } from "@/components/map/RiskMap";
import { StatusBadge } from "@/components/risk/RiskBadge";
import { RiskDistribution } from "@/components/risk/RiskDistribution";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { RISK_META, getRiskLevel } from "@/constants/risk";
import { useAsync } from "@/hooks/useAsync";
import { formatDateTime, shortAddress } from "@/lib/format";
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
      <div className="px-4 pt-5 pb-10 sm:px-8">
        <EmptyDashboard onSeeded={reload} />
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 pt-5 pb-10 sm:px-8">
      {/* 오늘의 최우선 점검 구간 */}
      {top && (
        <div className="flex flex-col gap-2 rounded-2xl bg-white px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
          <p className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-[15px]">
            <span className="size-2 rounded-full bg-[#d92d20]" aria-hidden />
            <span className="text-slate-700">가장 먼저 점검할 구간</span>
            <span className="font-bold text-[#d92d20]">
              {top.name} · {top.riskScore}점 {RISK_META[top.riskLevel].label}
            </span>
            <span className="text-slate-600">
              {shortAddress(top.address)} · 유효 보행공간 {Math.round(top.walkableRatio * 100)}%
              {top.roadDetourRequired && " · 차도 우회 발생"}
            </span>
          </p>
          <Link href={`/locations/${top.id}`} className="inline-flex items-center gap-1 text-[15px] font-bold text-brand-600 hover:text-brand-700">
            상세 확인 <ArrowRight className="size-4" />
          </Link>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {summary ? (
          <>
            <KpiCard label="전체 분석 구간" value={summary.totalCount} unit="개" hint={`${new Set(locations.map((l) => l.area)).size}개 생활권`} />
            <KpiCard label="발견된 단절구간" value={summary.disconnectedCount} unit="개" hint="위험도 26점 이상" />
            <KpiCard
              label="고위험 구간"
              value={<span className={RISK_META.DANGER.text}>{summary.highRiskCount}</span>}
              unit="개"
              hint="위험도 76점 이상"
            />
            <KpiCard
              label="평균 단절 위험도"
              value={<span className={RISK_META[avgLevel].text}>{summary.averageRiskScore}</span>}
              unit={`/ 100 · ${RISK_META[avgLevel].label}`}
              hint="전체 구간 평균"
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[132px] rounded-2xl" />)
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        {/* 우선점검 필요 구간 */}
        <Card className="min-w-0 xl:col-span-8">
          <CardHeader
            title="우선점검 필요 구간"
            description="조치가 완료되지 않은 구간을 위험도 높은 순으로 표시합니다"
            action={<TextLink href="/map">전체 보기</TextLink>}
          />
          <div className="px-6 pt-4 pb-3">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14" />
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
            <CardHeader title="위험지도" action={<TextLink href="/map">지도에서 보기</TextLink>} />
            <CardBody className="pt-4">
              <button
                type="button"
                onClick={() => router.push("/map")}
                className="block w-full overflow-hidden rounded-xl"
                aria-label="위험지도로 이동"
              >
                <RiskMap locations={locations} interactive={false} className="aspect-[16/11] w-full" />
              </button>
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
        <CardHeader title="최근 분석 구간" action={<TextLink href="/analysis">새 분석</TextLink>} />
        <CardBody className="grid gap-3 pt-4 sm:grid-cols-2 xl:grid-cols-4">
          {recent.map((loc) => (
            <Link key={loc.id} href={`/locations/${loc.id}`} className="rounded-xl bg-slate-50 p-4 transition hover:bg-slate-100">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate font-bold text-slate-900">{loc.name}</span>
                <span className={`tabular text-xl font-extrabold ${RISK_META[loc.riskLevel].text}`}>{loc.riskScore}</span>
              </div>
              <p className="mt-0.5 truncate text-[13.5px] text-slate-500">{shortAddress(loc.address)}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[13px] text-slate-500">{formatDateTime(loc.analyzedAt)}</span>
                <StatusBadge status={loc.status} />
              </div>
            </Link>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

/** 카드 오른쪽 위 "→" 글자 링크 */
function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-[15px] font-bold text-brand-600 hover:text-brand-700">
      {children} <ArrowRight className="size-4" />
    </Link>
  );
}
