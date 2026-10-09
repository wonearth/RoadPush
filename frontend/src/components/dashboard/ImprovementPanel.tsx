import Link from "next/link";
import { ArrowRight, TrendingDown } from "lucide-react";
import { ALL_STATUSES, RISK_META, STATUS_META } from "@/constants/risk";
import type { Improvement, Location } from "@/types";
import { MediaFrame } from "../media/MediaFrame";

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : 0);

/** 상태별 구간 수 — 한 줄 막대 + 범례 */
function StatusBreakdown({ locations }: { locations: Location[] }) {
  const counts = ALL_STATUSES.map((s) => ({ s, n: locations.filter((l) => l.status === s).length }));
  const total = locations.length || 1;
  const active = locations.filter((l) => l.status !== "CLOSED").length;
  const resolved = counts.find((c) => c.s === "RESOLVED")!.n;
  return (
    <div>
      <p className="text-[15px] text-slate-500">조치 완료율</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="tabular text-[38px] leading-none font-extrabold tracking-tight text-slate-900">
          {active ? Math.round((resolved / active) * 100) : 0}
        </span>
        <span className="text-base text-slate-500">% ({resolved}/{active}곳)</span>
      </p>
      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
        {counts.map(({ s, n }) => n > 0 && <span key={s} className={STATUS_META[s].dot} style={{ width: `${(n / total) * 100}%` }} />)}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {counts.map(({ s, n }) => (
          <li key={s} className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${STATUS_META[s].dot}`} />
            <span className="text-slate-600">{STATUS_META[s].label}</span>
            <span className="tabular ml-auto font-semibold text-slate-900">{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 조치 전후 평균 위험도 + 개선 폭 큰 구간 */
function AverageChange({ items }: { items: Improvement[] }) {
  const before = avg(items.map((i) => i.before.riskScore));
  const after = avg(items.map((i) => i.after.riskScore));
  return (
    <div>
      <p className="text-[15px] text-slate-500">조치 전후 평균 위험도</p>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="tabular text-2xl font-bold text-slate-400 line-through decoration-2">{before}</span>
        <ArrowRight className="size-4 self-center text-slate-400" />
        <span className="tabular text-[38px] leading-none font-extrabold tracking-tight text-slate-900">{after}</span>
        <span className="inline-flex items-center gap-0.5 text-[15px] font-bold text-[#16a34a]">
          <TrendingDown className="size-4" /> {before - after}점
        </span>
      </p>
      <p className="mt-1 text-sm text-slate-500">재분석까지 마친 {items.length}곳 기준</p>
      <ol className="mt-4 space-y-1.5">
        {items.slice(0, 3).map(({ location, before, after }) => (
          <li key={location.id}>
            <Link
              href={`/locations/${location.id}`}
              className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm hover:bg-slate-100"
            >
              <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">{location.name}</span>
              <span className={`tabular ${RISK_META[before.riskLevel].text}`}>{before.riskScore}</span>
              <ArrowRight className="size-3 text-slate-400" />
              <span className={`tabular font-bold ${RISK_META[after.riskLevel].text}`}>{after.riskScore}</span>
              <span className="tabular w-12 text-right text-xs font-semibold text-[#16a34a]">−{before.riskScore - after.riskScore}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** 대표 개선 사례 — 개선 폭이 가장 큰 구간의 전/후 사진 */
function BestCase({ item }: { item: Improvement }) {
  const shots = [
    { title: "조치 전", r: item.before },
    { title: "조치 후", r: item.after },
  ];
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[15px] text-slate-500">대표 개선 사례</p>
        <Link href={`/locations/${item.location.id}`} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          {item.location.name} →
        </Link>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {shots.map(({ title, r }) => (
          <div key={title}>
            <MediaFrame
              variant="result"
              src={r.originalImageUrl}
              resultSrc={r.resultImageUrl}
              overlay={r.overlay}
              walkableRatio={r.walkableRatio}
              roadDetourRequired={r.roadDetourRequired}
              className="rounded-xl"
            />
            <p className="mt-1.5 flex items-baseline gap-1.5 text-sm">
              <span className="text-slate-500">{title}</span>
              <span className={`tabular text-lg font-bold ${RISK_META[r.riskLevel].text}`}>{r.riskScore}</span>
              <span className="text-xs text-slate-500">보행공간 {Math.round(r.walkableRatio * 100)}%</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 대시보드 '조치 현황 · 개선 효과' — 찾고 → 조치하고 → 나아졌는지 확인하는 흐름을 보여준다. */
export function ImprovementPanel({ locations, improvements }: { locations: Location[]; improvements: Improvement[] }) {
  return (
    <div className="grid gap-8 lg:grid-cols-2 2xl:grid-cols-[1fr_1fr_1.4fr]">
      <StatusBreakdown locations={locations} />
      {improvements.length ? (
        <>
          <AverageChange items={improvements} />
          <div className="lg:col-span-2 2xl:col-span-1">
            <BestCase item={improvements[0]} />
          </div>
        </>
      ) : (
        <p className="self-center rounded-xl bg-slate-50 px-5 py-6 text-[15px] text-slate-500 lg:col-span-1 2xl:col-span-2">
          조치 후 재분석을 마친 구간이 없습니다.
        </p>
      )}
    </div>
  );
}
