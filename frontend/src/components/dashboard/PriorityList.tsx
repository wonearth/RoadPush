"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { OBSTACLE_META, PASSABILITY_META, RISK_META, getPassability } from "@/constants/risk";
import { departmentOf } from "@/lib/admin";
import { formatPercent, subAddress } from "@/lib/format";
import type { Location } from "@/types";
import { DueText } from "../location/AdminMeta";
import { ReasonTags } from "../location/ReasonTags";
import { MockBadge } from "../ui/MockNotice";
import { RiskBadge, StatusBadge } from "../risk/RiskBadge";

/** 우선점검 필요 구간 — 위험도 높은 순 표 */
export function PriorityList({ locations }: { locations: Location[] }) {
  const router = useRouter();
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-left text-[15px]">
        <thead>
          <tr className="bg-slate-50 text-sm text-slate-600">
            <th className="w-16 rounded-l-lg py-3 pr-4 pl-4 font-semibold whitespace-nowrap">순위</th>
            <th className="py-3 font-semibold">구간</th>
            <th className="w-24 py-3 font-semibold">위험도</th>
            <th className="py-3 font-semibold">주요 원인</th>
            <th className="w-44 py-3 font-semibold">보행공간 / 통행 판단</th>
            <th className="w-28 py-3 font-semibold">담당</th>
            <th className="w-32 py-3 font-semibold">처리기한</th>
            <th className="w-[88px] rounded-r-lg py-3 pr-4 font-semibold">조치상태</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((loc, i) => (
            // 줄 전체를 눌러 상세로 간다. 링크를 ::after 로 줄 전체에 펼치는 방식은 사파리에서 tr 이 기준이 되지 않아
            // 링크가 화면 전체를 덮어버리므로(어디를 눌러도 1위 구간으로 이동) 클릭 처리로 대신한다
            <tr
              key={loc.id}
              onClick={(e) => {
                if (!(e.target as HTMLElement).closest("a")) router.push(`/locations/${loc.id}`);
              }}
              className="group cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
            >
              <td className="py-4 pr-4 pl-4 text-slate-600">{i + 1}</td>
              <td className="py-4 pr-4">
                <Link href={`/locations/${loc.id}`} className="font-bold whitespace-nowrap text-slate-900">
                  {loc.name}
                </Link>
                {loc.isSample && <MockBadge label="예시" className="ml-1.5" />}
                <p className="mt-0.5 max-w-56 truncate text-[13.5px] text-slate-500">
                  {loc.code && <span className="tabular mr-1.5 text-slate-400">{loc.code}</span>}
                  {subAddress(loc)}
                </p>
                <ReasonTags location={loc} max={2} compact className="mt-1.5" />
              </td>
              <td className="py-4 pr-4 whitespace-nowrap">
                <span className={`tabular mr-1.5 text-xl font-extrabold ${RISK_META[loc.riskLevel].text}`}>{loc.riskScore}</span>
                <RiskBadge level={loc.riskLevel} />
              </td>
              <td className="py-4 pr-4 whitespace-nowrap text-slate-800">
                {loc.obstacleTypes.length ? loc.obstacleTypes.map((t) => OBSTACLE_META[t].label).join(", ") : "—"}
              </td>
              <td className="py-4 pr-4 whitespace-nowrap">
                <span className="tabular font-bold text-slate-900">{formatPercent(loc.walkableRatio)}</span>
                <span className="ml-2 text-[13.5px] font-semibold text-slate-600">
                  {PASSABILITY_META[getPassability(loc)].label}
                </span>
              </td>
              <td className="py-4 pr-4 whitespace-nowrap text-slate-700">{departmentOf(loc)}</td>
              <td className="py-4 pr-4">
                <DueText location={loc} />
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
