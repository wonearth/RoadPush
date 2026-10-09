"use client";

import { ArrowRight, RotateCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EmptyDashboard } from "@/components/dashboard/EmptyDashboard";
import { ImprovementPanel } from "@/components/dashboard/ImprovementPanel";
import { KpiCard, KpiStrip } from "@/components/dashboard/KpiCard";
import { PriorityList } from "@/components/dashboard/PriorityList";
import { RiskMap } from "@/components/map/RiskMap";
import { RiskDistribution } from "@/components/risk/RiskDistribution";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { RISK_META, getRiskLevel, isOpenStatus } from "@/constants/risk";
import { useAsync } from "@/hooks/useAsync";
import { cn } from "@/lib/cn";
import { formatDateTime, shortAddress } from "@/lib/format";
import { locationService } from "@/services";

export default function DashboardPage() {
  const router = useRouter();
  const { data, loading, reload } = useAsync(
    () =>
      Promise.all([
        locationService.getDashboardSummary(),
        locationService.list({ sort: "risk-desc" }),
        locationService.getImprovements(),
        // 화면에 표시하는 데이터 기준 시각
        Promise.resolve(new Date().toISOString()),
      ]),
    "dashboard",
  );
  const [summary, locations = [], improvements = [], loadedAt] = data ?? [];
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  // 한 번만: 예시 데이터를 쓰는 환경이면 새로 추가된 예시 구간·이력을 채우고, 관리번호가 없는 구간에 번호를 붙인다
  const synced = useRef(false);
  useEffect(() => {
    if (synced.current || !data) return;
    synced.current = true;
    const seed = locations.some((l) => l.isSample) ? locationService.seedSampleData() : Promise.resolve(0);
    seed
      .then(async (n) => {
        if (n + (await locationService.assignMissingCodes()) > 0) reload();
      })
      // 다른 탭에서 동시에 채우면 이력 문서 덮어쓰기가 규칙에 막혀 실패할 수 있다 — 화면에는 영향 없으니 무시한다
      .catch(() => {});
  }, [data, locations, reload]);
  // 종료된 구간(잘못 분석됨·중복 등)은 대시보드에서 뺀다
  const active = locations.filter((l) => l.status !== "CLOSED");
  const priority = active.filter((l) => isOpenStatus(l.status) && l.riskLevel !== "SAFE").slice(0, 6);
  const avgLevel = summary ? getRiskLevel(summary.averageRiskScore) : "SAFE";
  const top = priority[0];

  if (summary && locations.length === 0) {
    return (
      <div className="px-4 pt-5 pb-10 sm:px-8">
        <EmptyDashboard onSeeded={reload} />
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 pt-5 pb-10 sm:px-8">
      <div className="-mb-2 flex items-center justify-end gap-2 text-sm text-slate-500">
        {loadedAt && <span className="tabular">{formatDateTime(loadedAt)} 기준</span>}
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium text-slate-600 hover:bg-white disabled:opacity-50"
        >
          <RotateCw className={cn("size-3.5", refreshing && "animate-spin")} /> 새로고침
        </button>
      </div>
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
              {shortAddress(top.address)}, 유효 보행공간 {Math.round(top.walkableRatio * 100)}%
              {top.roadDetourRequired && ", 차도 우회 발생"}
            </span>
          </p>
          <Link href={`/locations/${top.id}`} className="inline-flex items-center gap-1 text-[15px] font-bold text-brand-600 hover:text-brand-700">
            상세 확인 <ArrowRight className="size-4" />
          </Link>
        </div>
      )}

      {/* 요약 지표 */}
      <KpiStrip>
        {summary ? (
          <>
            <KpiCard
              label="전체 분석 구간"
              value={summary.totalCount}
              unit="개"
              hint={`${new Set(active.map((l) => l.area)).size}개 생활권`}
              info="AI 분석 후 관리 대상으로 등록된 보행구간 수 (조치 없이 종료된 구간 제외)"
            />
            <KpiCard
              label="발견된 단절구간"
              value={summary.disconnectedCount}
              unit="개"
              hint="위험도 26점 이상"
              info="위험도 26점 이상(주의·경고·위험) 구간. 장애물로 보행공간이 좁아지거나 끊긴 상태"
            />
            <KpiCard
              label="고위험 구간"
              value={<span className={RISK_META.DANGER.text}>{summary.highRiskCount}</span>}
              unit="개"
              hint="위험도 76점 이상"
              info="위험도 76점 이상 구간. 보행자가 차도로 내려가야 하는 수준으로 최우선 점검 대상"
            />
            <KpiCard
              label="평균 단절 위험도"
              value={<span className={RISK_META[avgLevel].text}>{summary.averageRiskScore}</span>}
              unit={`/ 100 ${RISK_META[avgLevel].label}`}
              info="전체 구간 위험도 평균. 0~25 안전, 26~50 주의, 51~75 경고, 76~100 위험"
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[88px] rounded-none" />)
        )}
      </KpiStrip>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* 우선점검 필요 구간 */}
        <Card className="min-w-0">
          <CardHeader
            title="우선점검 필요 구간"
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

        <div className="grid min-w-0 content-start gap-5 md:grid-cols-2 2xl:grid-cols-1">
          <Card>
            <CardHeader title="위험지도" action={<TextLink href="/map">지도에서 보기</TextLink>} />
            <CardBody className="pt-4">
              <button
                type="button"
                onClick={() => router.push("/map")}
                className="block w-full overflow-hidden rounded-xl"
                aria-label="위험지도로 이동"
              >
                <RiskMap locations={active} interactive={false} className="aspect-[16/11] w-full" />
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

      {/* 조치 현황 및 개선 효과 */}
      <Card>
        <CardHeader title="조치 현황 및 개선 효과" />
        <CardBody className="pt-5">
          {data ? <ImprovementPanel locations={locations} improvements={improvements} /> : <Skeleton className="h-48" />}
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
