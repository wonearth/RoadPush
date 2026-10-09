import { X } from "lucide-react";
import { OBSTACLE_META, PASSABILITY_META, RISK_META, STATUS_META, getPassability } from "@/constants/risk";
import { formatDateTime, formatPercent, shortAddress } from "@/lib/format";
import type { Location } from "@/types";
import { RiskBadge } from "../risk/RiskBadge";
import { ButtonLink } from "../ui/Button";

/** 지도 marker 선택 시 보여주는 구간 요약 */
export function LocationSummaryCard({ location, onClose }: { location: Location; onClose?: () => void }) {
  const rows: [string, string][] = [
    ["주요 원인", location.obstacleTypes.map((t) => OBSTACLE_META[t].label).join(", ") || "주요 장애물 없음"],
    ["통행 판단", PASSABILITY_META[getPassability(location)].label],
    ["유효 보행공간", formatPercent(location.walkableRatio)],
    ["조치상태", STATUS_META[location.status].label],
    ["분석 일시", formatDateTime(location.analyzedAt)],
  ];
  return (
    <div className="w-full rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(25,31,40,0.14)] sm:w-80">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-lg font-bold text-slate-900">{location.name}</p>
          <p className="mt-0.5 truncate text-sm text-slate-500">{shortAddress(location.address)}</p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="-mt-1 -mr-1 rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="닫기">
            <X className="size-5" />
          </button>
        )}
      </div>

      <p className="mt-3 flex items-baseline gap-1.5">
        <span className={`tabular text-4xl font-extrabold tracking-tight ${RISK_META[location.riskLevel].text}`}>
          {location.riskScore}
        </span>
        <RiskBadge level={location.riskLevel} className="text-base" />
      </p>

      <dl className="mt-3 space-y-2 text-[14px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="shrink-0 text-slate-500">{k}</dt>
            <dd className="tabular text-right font-semibold text-slate-900">{v}</dd>
          </div>
        ))}
      </dl>

      <ButtonLink href={`/locations/${location.id}`} className="mt-4 w-full">
        상세보기
      </ButtonLink>
    </div>
  );
}
