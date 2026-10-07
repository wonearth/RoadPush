import Link from "next/link";
import { OBSTACLE_META, RISK_META } from "@/constants/risk";
import { formatPercent, shortAddress } from "@/lib/format";
import type { Location } from "@/types";
import { RiskBadge, StatusBadge } from "../risk/RiskBadge";

/** 우선점검 필요 구간 — 위험도 높은 순 표 */
export function PriorityList({ locations }: { locations: Location[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-[15px]">
        <thead>
          <tr className="bg-slate-50 text-sm text-slate-600">
            <th className="w-14 rounded-l-lg py-3 pl-4 font-semibold">순위</th>
            <th className="py-3 font-semibold">구간</th>
            <th className="w-28 py-3 font-semibold">위험도</th>
            <th className="py-3 font-semibold">주요 원인</th>
            <th className="w-40 py-3 font-semibold">유효 보행공간</th>
            <th className="w-24 rounded-r-lg py-3 pr-4 font-semibold">조치상태</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((loc, i) => (
            <tr key={loc.id} className="group relative border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
              <td className="py-4 pl-4 text-slate-600">{i + 1}</td>
              <td className="py-4 pr-4">
                <Link href={`/locations/${loc.id}`} className="font-bold text-slate-900 after:absolute after:inset-0">
                  {loc.name}
                </Link>
                <p className="mt-0.5 text-[13.5px] text-slate-500">{shortAddress(loc.address)}</p>
              </td>
              <td className="py-4 pr-4 whitespace-nowrap">
                <span className={`tabular mr-1.5 text-xl font-extrabold ${RISK_META[loc.riskLevel].text}`}>{loc.riskScore}</span>
                <RiskBadge level={loc.riskLevel} />
              </td>
              <td className="py-4 pr-4 whitespace-nowrap text-slate-800">
                {loc.obstacleTypes.length ? loc.obstacleTypes.map((t) => OBSTACLE_META[t].label).join(" · ") : "—"}
              </td>
              <td className="py-4 pr-4 whitespace-nowrap">
                <span className="tabular font-bold text-slate-900">{formatPercent(loc.walkableRatio)}</span>
                {loc.roadDetourRequired && <span className="ml-2 text-[13.5px] font-semibold text-slate-600">차도 우회</span>}
              </td>
              <td className="py-4 pr-4">
                <StatusBadge status={loc.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
