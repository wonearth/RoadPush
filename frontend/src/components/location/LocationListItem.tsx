import { OBSTACLE_META, PASSABILITY_META, RISK_META, getPassability } from "@/constants/risk";
import { cn } from "@/lib/cn";
import { formatPercent, shortAddress } from "@/lib/format";
import type { Location } from "@/types";
import { StatusBadge } from "../risk/RiskBadge";

export function LocationListItem({
  location,
  selected,
  onSelect,
}: {
  location: Location;
  selected: boolean;
  onSelect: () => void;
}) {
  const causes = location.obstacleTypes.map((t) => OBSTACLE_META[t].label).join(", ") || "주요 장애물 없음";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left transition-colors",
        selected ? "bg-brand-50" : "hover:bg-slate-50",
      )}
    >
      <span className={cn("tabular w-11 shrink-0 text-2xl font-extrabold", RISK_META[location.riskLevel].text)}>
        {location.riskScore}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-slate-900">{location.name}</span>
        <span className="mt-0.5 block truncate text-[13.5px] text-slate-500">{shortAddress(location.address)}</span>
        <span className="mt-1 block truncate text-[13px] text-slate-600">
          {causes}
          <span className="ml-2 text-slate-400">
            보행공간 {formatPercent(location.walkableRatio)}, {PASSABILITY_META[getPassability(location)].label}
          </span>
        </span>
      </span>
      <StatusBadge status={location.status} className="shrink-0" />
    </button>
  );
}
