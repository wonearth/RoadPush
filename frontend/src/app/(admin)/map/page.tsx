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
    <div className="flex flex-col lg:h-[calc(100vh-4rem)] lg:flex-row">
      {/* 목록 panel */}
      <aside className="flex flex-col border-b border-slate-200 bg-white lg:w-[400px] lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="space-y-3 border-b border-slate-200 p-4">
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
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors",
                    active ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
                  )}
                >
                  {lv !== "ALL" && <span className="size-2 rounded-full" style={{ backgroundColor: RISK_META[lv].hex }} />}
                  {lv === "ALL" ? "전체" : RISK_META[lv].label}
                  <span className={cn("tabular", active ? "text-slate-300" : "text-slate-400")}>
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
                className={cn(inputClass, "py-2 pl-8 text-[13px]")}
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
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={cn(inputClass, "py-2 text-[13px]")}>
                <option value="risk-desc">위험도 높은순</option>
                <option value="risk-asc">위험도 낮은순</option>
                <option value="recent">최근 분석순</option>
              </select>
            </label>
          </div>
        </div>
        <p className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
          <span className="tabular font-semibold text-slate-800">{filtered.length}</span>개 구간
        </p>
        <div className="max-h-[420px] flex-1 divide-y divide-slate-100 overflow-y-auto lg:max-h-none">
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
      <section className="relative h-[520px] flex-1 lg:h-auto">
        <div className="absolute inset-0">
          <RiskMap locations={filtered} selectedId={selectedId} onSelect={select} className="size-full" />
        </div>
        <div className="absolute top-4 left-4 z-10 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-sm">
          <p className="mb-1 text-[11px] font-semibold text-slate-500">보행공간 단절 위험도</p>
          <RiskLegend />
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
    <Suspense fallback={<Skeleton className="m-6 h-[600px]" />}>
      <RiskMapPageContent />
    </Suspense>
  );
}
