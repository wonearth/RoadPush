"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { LocationListItem } from "@/components/location/LocationListItem";
import { LocationSummaryCard } from "@/components/location/LocationSummaryCard";
import { RiskMap } from "@/components/map/RiskMap";
import { RiskLegend } from "@/components/risk/RiskLegend";
import { inputClass } from "@/components/ui/Field";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { OBSTACLE_META, OBSTACLE_TYPES, RISK_LEVELS, RISK_META } from "@/constants/risk";
import { useAsync } from "@/hooks/useAsync";
import { cn } from "@/lib/cn";
import { locationService } from "@/services";
import type { LocationQuery, ObstacleType, RiskLevel } from "@/types";

type SortKey = NonNullable<LocationQuery["sort"]>;

function RiskMapPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("selected");

  const [level, setLevel] = useState<RiskLevel | "ALL">("ALL");
  const [keyword, setKeyword] = useState("");
  const [obstacle, setObstacle] = useState<ObstacleType | "">("");
  const [sort, setSort] = useState<SortKey>("risk-desc");

  const { data: all = [], loading } = useAsync(() => locationService.list(), "locations");

  const counts = useMemo(() => {
    const c = Object.fromEntries(RISK_LEVELS.map((lv) => [lv, 0])) as Record<RiskLevel, number>;
    all.forEach((l) => c[l.riskLevel]++);
    return c;
  }, [all]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return all
      .filter((l) => level === "ALL" || l.riskLevel === level)
      .filter((l) => !obstacle || l.obstacleTypes.includes(obstacle))
      .filter((l) => !kw || `${l.name} ${l.address} ${l.area}`.toLowerCase().includes(kw))
      .sort((a, b) =>
        sort === "risk-asc"
          ? a.riskScore - b.riskScore
          : sort === "recent"
            ? b.analyzedAt.localeCompare(a.analyzedAt)
            : b.riskScore - a.riskScore,
      );
  }, [all, level, obstacle, keyword, sort]);

  const selected = all.find((l) => l.id === selectedId) ?? null;
  const select = (id: string | null) => router.replace(id ? `/map?selected=${id}` : "/map", { scroll: false });

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-8 lg:h-[calc(100vh-7.75rem)] lg:flex-row sm:px-8">
      {/* 목록 panel */}
      <aside className="flex min-h-0 flex-col rounded-2xl bg-white p-4 lg:w-[380px] lg:shrink-0">
        <div className="space-y-3 px-1 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="구간명, 주소, 생활권 검색"
              className={cn(inputClass, "pl-9")}
              aria-label="위치 검색"
            />
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
                    {lv === "ALL" ? all.length : counts[lv]}
                  </span>
                </button>
              );
            })}
          </div>
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
            <label className="w-36">
              <span className="sr-only">정렬</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={cn(inputClass, "py-2.5 text-sm")}>
                <option value="risk-desc">위험도 높은순</option>
                <option value="risk-asc">위험도 낮은순</option>
                <option value="recent">최근 분석순</option>
              </select>
            </label>
          </div>
        </div>
        <p className="px-1 pb-1 text-sm text-slate-500">
          <span className="tabular font-bold text-slate-900">{filtered.length}</span>개 구간
        </p>
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
          <div className="absolute inset-x-4 bottom-4 z-10 sm:inset-x-auto sm:right-4">
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
