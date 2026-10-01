import { ChevronRight, Footprints } from "lucide-react";
import Link from "next/link";
import { RISK_META } from "@/constants/risk";
import { formatPercent } from "@/lib/format";
import type { Location } from "@/types";
import { ObstacleTags } from "../risk/ObstacleTags";
import { RiskBadge, StatusBadge } from "../risk/RiskBadge";
import { RiskBar } from "../risk/RiskBar";

/** 우선점검 필요 구간 — 위험도 높은 순 */
export function PriorityList({ locations }: { locations: Location[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
            <th className="w-10 py-2.5 pl-5 font-medium">순위</th>
            <th className="w-28 py-2.5 font-medium">위험도</th>
            <th className="py-2.5 font-medium">위치</th>
            <th className="w-[230px] py-2.5 font-medium">주요 원인</th>
            <th className="w-28 py-2.5 font-medium">유효 보행공간</th>
            <th className="w-24 py-2.5 font-medium">조치상태</th>
            <th className="w-8 py-2.5 pr-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {locations.map((loc, i) => (
            <tr key={loc.id} className="group relative hover:bg-slate-50">
              <td className="py-3.5 pl-5">
                <span
                  className={
                    i < 3
                      ? "flex size-6 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white"
                      : "flex size-6 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-500"
                  }
                >
                  {i + 1}
                </span>
              </td>
              <td className="py-3.5 pr-4">
                <div className="flex items-center gap-2">
                  <span className={`tabular text-xl font-bold ${RISK_META[loc.riskLevel].text}`}>{loc.riskScore}</span>
                  <RiskBadge level={loc.riskLevel} />
                </div>
                <RiskBar score={loc.riskScore} level={loc.riskLevel} className="mt-1.5 w-24" />
              </td>
              <td className="py-3.5 pr-4">
                <Link href={`/locations/${loc.id}`} className="font-semibold text-slate-900 after:absolute after:inset-0">
                  {loc.name}
                </Link>
                <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">{loc.address}</p>
              </td>
              <td className="py-3.5 pr-4">
                <ObstacleTags types={loc.obstacleTypes} size="sm" />
                {loc.roadDetourRequired && (
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                    <Footprints className="size-3" aria-hidden />
                    차도 우회 필요
                  </p>
                )}
              </td>
              <td className="tabular py-3.5 pr-4 font-semibold text-slate-800">{formatPercent(loc.walkableRatio)}</td>
              <td className="py-3.5 pr-4">
                <StatusBadge status={loc.status} />
              </td>
              <td className="py-3.5 pr-4 text-slate-300 group-hover:text-slate-500">
                <ChevronRight className="size-4" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
