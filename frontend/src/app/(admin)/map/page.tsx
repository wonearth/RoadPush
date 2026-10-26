"use client";

import { Camera, Download, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useRef, useState } from "react";
import { LocationListItem } from "@/components/location/LocationListItem";
import { LocationSummaryCard } from "@/components/location/LocationSummaryCard";
import { RegisterPhotosDialog } from "@/components/location/RegisterPhotosDialog";
import { Button } from "@/components/ui/Button";
import { RiskMap } from "@/components/map/RiskMap";
import { RiskLegend } from "@/components/risk/RiskLegend";
import { inputClass } from "@/components/ui/Field";
import { EmptyState, Skeleton } from "@/components/ui/States";
import {
  ALL_STATUSES,
  OBSTACLE_META,
  OBSTACLE_TYPES,
  RISK_LEVELS,
  RISK_META,
  STATUS_META,
  isOpenStatus,
  isPendingAnalysis,
} from "@/constants/risk";
import { useAsync } from "@/hooks/useAsync";
import { cn } from "@/lib/cn";
import { downloadCsv, locationsToCsv } from "@/lib/exportCsv";
import { analysisService, isLiveAnalysis, locationService } from "@/services";
import type { AnalysisResult, Location, LocationQuery, LocationStatus, ObstacleType, RiskLevel } from "@/types";

type SortKey = NonNullable<LocationQuery["sort"]>;
/** OPEN = 조치 완료 전 (담당자가 가장 자주 보는 목록) */
/** ALL 은 종료된 구간을 뺀 전체, OPEN 은 조치가 끝나지 않은 구간, PENDING 은 AI 분석 대기 구간 */
type StatusFilter = "ALL" | "OPEN" | "PENDING" | LocationStatus;

function matchStatus(l: Location, filter: StatusFilter) {
  if (filter === "ALL") return l.status !== "CLOSED";
  if (filter === "PENDING") return isPendingAnalysis(l);
  // 나머지 조치 상태는 점수가 있는 구간만 대상으로 한다
  if (isPendingAnalysis(l)) return false;
  if (filter === "OPEN") return isOpenStatus(l.status);
  return l.status === filter;
}

function RiskMapPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("selected");

  const [level, setLevel] = useState<RiskLevel | "ALL">("ALL");
  const [keyword, setKeyword] = useState("");
  const [obstacle, setObstacle] = useState<ObstacleType | "">("");
  const [sort, setSort] = useState<SortKey>("risk-desc");
  const [status, setStatus] = useState<StatusFilter>("ALL");

  const { data: all = [], loading, reload } = useAsync(() => locationService.list(), "locations");

  // 'AI 분석 대기' 구간을 순서대로 모두 분석한다 (서버는 사진을 한 장씩 처리하므로 순차 실행)
  const [bulk, setBulk] = useState<{ done: number; total: number; name: string; failed: string[] } | null>(null);
  const stopBulk = useRef(false);
  const pendingTargets = useMemo(() => all.filter((l) => isPendingAnalysis(l) && l.photos?.length), [all]);

  const runBulkAnalysis = async () => {
    if (bulk || !pendingTargets.length) return;
    stopBulk.current = false;
    const targets = pendingTargets;
    const failed: string[] = [];
    let consecutiveFail = 0;
    setBulk({ done: 0, total: targets.length, name: "", failed });
    for (const [i, loc] of targets.entries()) {
      if (stopBulk.current) break;
      setBulk({ done: i, total: targets.length, name: loc.name, failed: [...failed] });
      const results: AnalysisResult[] = [];
      for (const photo of loc.photos ?? []) {
        if (stopBulk.current) break;
        try {
          results.push(await analysisService.analyze({ file: null, mediaType: "image", originalImageUrl: photo.url }));
        } catch {
          /* 사진 한 장 실패는 건너뛴다 (보도를 못 찾은 사진 등) */
        }
      }
      if (!results.length) {
        failed.push(loc.name);
        // 서버가 꺼져 있거나 주소가 틀리면 계속 실패하므로 연속 3곳 실패하면 멈춘다
        if (++consecutiveFail >= 3) break;
        continue;
      }
      consecutiveFail = 0;
      try {
        const best = results.reduce((a, b) => (b.riskScore > a.riskScore ? b : a)); // 지점 점수 = 사진별 최댓값
        await locationService.completeInitialAnalysis(loc.id, best);
        await reload();
      } catch {
        failed.push(loc.name);
      }
    }
    setBulk({ done: targets.length, total: targets.length, name: "", failed: [...failed] });
    await reload();
    setTimeout(() => setBulk(null), failed.length ? 15000 : 4000);
  };

  const counts = useMemo(() => {
    const c = Object.fromEntries(RISK_LEVELS.map((lv) => [lv, 0])) as Record<RiskLevel, number>;
    // 위험등급 칩 숫자는 고른 조치상태 안에서 센다 (목록 개수와 맞춘다)
    all.filter((l) => matchStatus(l, status) && !isPendingAnalysis(l)).forEach((l) => c[l.riskLevel]++);
    return c;
  }, [all, status]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return all
      .filter((l) => level === "ALL" || (!isPendingAnalysis(l) && l.riskLevel === level))
      .filter((l) => !obstacle || l.obstacleTypes.includes(obstacle))
      .filter((l) => matchStatus(l, status))
      .filter((l) => !kw || `${l.name} ${l.address} ${l.area}`.toLowerCase().includes(kw))
      .sort((a, b) => {
        // AI 분석 대기 구간은 점수가 없으므로 위험도 정렬에서는 항상 뒤에, 관리번호 순으로 둔다
        const pa = isPendingAnalysis(a);
        const pb = isPendingAnalysis(b);
        if (sort !== "recent" && pa !== pb) return pa ? 1 : -1;
        if (sort !== "recent" && pa && pb) return (a.code ?? "").localeCompare(b.code ?? "");
        return sort === "risk-asc"
          ? a.riskScore - b.riskScore
          : sort === "recent"
            ? b.analyzedAt.localeCompare(a.analyzedAt)
            : b.riskScore - a.riskScore;
      });
  }, [all, level, obstacle, status, keyword, sort]);

  const selected = all.find((l) => l.id === selectedId) ?? null;
  // 지금 걸린 필터·정렬 그대로 내려받는다
  const exportList = () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    downloadCsv(`RoadPush_위험구간_${today}.csv`, locationsToCsv(filtered));
  };
  const select = (id: string | null) => router.replace(id ? `/map?selected=${id}` : "/map", { scroll: false });
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-8 lg:h-[calc(100vh-7.75rem)] lg:flex-row sm:px-8">
      {registerOpen && (
        <RegisterPhotosDialog onClose={() => setRegisterOpen(false)} onRegistered={(loc) => router.push(`/locations/${loc.id}`)} />
      )}
      {/* 목록 panel */}
      <aside className="flex min-h-0 flex-col rounded-2xl bg-white p-4 lg:w-[380px] lg:shrink-0">
        <div className="space-y-3 px-1 pb-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="구간명, 주소, 생활권 검색"
                className={cn(inputClass, "pl-9")}
                aria-label="위치 검색"
              />
            </div>
            <Button onClick={() => setRegisterOpen(true)} icon={<Camera className="size-4" />} className="shrink-0">
              사진 등록
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="위험등급 필터">
            {(["ALL", ...RISK_LEVELS] as const).map((lv) => {
              const active = level === lv;
              return (
                <button
                  key={lv}
                  type="button"
                  onClick={() => setLevel(lv)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                    active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  )}
                >
                  {lv === "ALL" ? "전체" : RISK_META[lv].label}
                  <span className={cn("tabular", active ? "text-slate-300" : "text-slate-500")}>
                    {lv === "ALL" ? all.filter((l) => matchStatus(l, status)).length : counts[lv]}
                  </span>
                </button>
              );
            })}
          </div>
          {(pendingTargets.length > 0 || bulk) && (
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              {bulk ? (
                <div className="space-y-1.5" role="status">
                  <p className="font-semibold text-slate-900">
                    {bulk.done >= bulk.total ? "분석 완료" : `AI 분석 중 ${bulk.done + 1}/${bulk.total}`}
                    {bulk.name && <span className="font-normal text-slate-600"> · {bulk.name}</span>}
                  </p>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full bg-brand-500 transition-all" style={{ width: `${(bulk.done / bulk.total) * 100}%` }} />
                  </div>
                  {bulk.failed.length > 0 && (
                    <p className="text-red-600">실패 {bulk.failed.length}곳: {bulk.failed.slice(0, 3).join(", ")}{bulk.failed.length > 3 ? " 외" : ""}</p>
                  )}
                  {bulk.done < bulk.total && (
                    <button type="button" onClick={() => (stopBulk.current = true)} className="font-medium text-slate-600 underline">
                      중지
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-slate-600">
                    AI 분석 대기 <span className="tabular font-bold text-slate-900">{pendingTargets.length}</span>곳
                  </p>
                  <Button
                    onClick={runBulkAnalysis}
                    disabled={!isLiveAnalysis}
                    title={isLiveAnalysis ? undefined : "AI 서버에 연결되지 않아 지금은 분석할 수 없습니다"}
                    icon={<Sparkles className="size-4" />}
                    className="shrink-0"
                  >
                    전체 분석
                  </Button>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <label className="relative flex-1">
              <span className="sr-only">원인 필터</span>
              <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
              <select
                value={obstacle}
                onChange={(e) => setObstacle(e.target.value as ObstacleType | "")}
                className={cn(inputClass, "py-2.5 pl-8 text-sm")}
              >
                <option value="">모든 원인</option>
                {OBSTACLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {OBSTACLE_META[t].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex-1">
              <span className="sr-only">조치 상태 필터</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className={cn(inputClass, "py-2.5 text-sm")}
              >
                <option value="ALL">종료 제외 전체</option>
                <option value="OPEN">조치 전 전체</option>
                <option value="PENDING">AI 분석 대기</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-between px-1 pb-1 text-sm text-slate-500">
          <p>
            <span className="tabular font-bold text-slate-900">{filtered.length}</span>개 구간
          </p>
          <div className="flex items-center gap-1">
            <label>
              <span className="sr-only">정렬</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-lg bg-transparent py-1 pr-1 text-sm font-semibold text-slate-700 focus:outline-2 focus:outline-brand-500"
              >
                <option value="risk-desc">위험도 높은순</option>
                <option value="risk-asc">위험도 낮은순</option>
                <option value="recent">최근 분석순</option>
              </select>
            </label>
            <button
              type="button"
              onClick={exportList}
              disabled={!filtered.length}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Download className="size-3.5" /> 엑셀
            </button>
          </div>
        </div>
        <div className="max-h-[420px] flex-1 space-y-0.5 overflow-y-auto lg:max-h-none">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filtered.length ? (
            filtered.map((loc) => (
              <LocationListItem key={loc.id} location={loc} selected={loc.id === selectedId} onSelect={() => select(loc.id)} />
            ))
          ) : (
            <EmptyState title="조건에 맞는 구간이 없습니다" description="검색어나 필터를 변경해 보세요." />
          )}
        </div>
      </aside>

      {/* 지도 */}
      <section className="relative h-[520px] overflow-hidden rounded-2xl lg:h-auto lg:flex-1">
        <div className="absolute inset-0">
          <RiskMap locations={filtered} selectedId={selectedId} onSelect={select} className="size-full" />
        </div>
        <div className="absolute top-4 left-4 z-10 rounded-xl bg-white px-4 py-2.5 shadow-[0_2px_10px_rgba(25,31,40,0.10)]">
          <RiskLegend compact />
        </div>
        {selected && (
          <div className="animate-sheet-up fixed inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:right-6 lg:absolute lg:right-4 lg:bottom-4 lg:z-10">
            <LocationSummaryCard location={selected} onClose={() => select(null)} />
          </div>
        )}
      </section>
    </div>
  );
}

export default function RiskMapPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-8 mt-5 h-[600px] rounded-2xl" />}>
      <RiskMapPageContent />
    </Suspense>
  );
}
