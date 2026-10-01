import { Footprints } from "lucide-react";
import { RISK_META } from "@/constants/risk";
import { cn } from "@/lib/cn";
import { formatObstacles, formatPercent } from "@/lib/format";
import type { Location } from "@/types";
import { RiskBadge, StatusBadge } from "../risk/RiskBadge";

export function LocationListItem({
  location,
  selected,
  onSelect,
}: {
  location: Location;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full gap-3 border-l-[3px] px-4 py-3.5 text-left transition-colors",
        selected ? "bg-brand-50/60" : "hover:bg-slate-50",
      )}
      style={{ borderLeftColor: selected ? RISK_META[location.riskLevel].hex : "transparent" }}
    >
      <span
        className="tabular flex size-11 shrink-0 items-center justify-center rounded-lg text-[17px] font-bold text-white"
        style={{ backgroundColor: RISK_META[location.riskLevel].hex }}
      >
        {location.riskScore}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-slate-900">{location.name}</span>
          <RiskBadge level={location.riskLevel} />
        </span>
        <span className="mt-0.5 block truncate text-xs text-slate-500">{location.address}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
          <span className="font-medium">{formatObstacles(location.obstacleTypes)}</span>
          <span className="text-slate-300">|</span>
          <span className="tabular">보행공간 {formatPercent(location.walkableRatio)}</span>
          {location.roadDetourRequired && (
            <Footprints className="size-3.5 text-red-500" aria-label="차도 우회 필요" />
          )}
        </span>
      </span>
      <StatusBadge status={location.status} className="self-start" />
    </button>
  );
}
