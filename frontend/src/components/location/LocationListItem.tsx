import { OBSTACLE_META, PASSABILITY_META, RISK_META, getPassability, isPendingAnalysis } from "@/constants/risk";
import { cn } from "@/lib/cn";
import { formatPercent, subAddress } from "@/lib/format";
import type { Location } from "@/types";
import { PendingBadge, StatusBadge } from "../risk/RiskBadge";

export function LocationListItem({
  location,
  selected,
  onSelect,
}: {
  location: Location;
  selected: boolean;
  onSelect: () => void;
}) {
  const pending = isPendingAnalysis(location);
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
      <span
        className={cn(
          "tabular w-11 shrink-0 font-extrabold",
          pending ? "text-base text-slate-300" : cn("text-2xl", RISK_META[location.riskLevel].text),
        )}
      >
        {pending ? "—" : location.riskScore}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-slate-900">{location.name}</span>
        <span className="mt-0.5 block truncate text-[13.5px] text-slate-500">
          {location.code && <span className="tabular mr-1.5 text-slate-400">{location.code}</span>}
          {subAddress(location)}
        </span>
        <span className="mt-1 block truncate text-[13px] text-slate-600">
          {pending ? (
            `현장 사진 ${location.photos?.length ?? 0}장`
          ) : (
            <>
              {causes}
              <span className="ml-2 text-slate-400">
                보행공간 {formatPercent(location.walkableRatio)}, {PASSABILITY_META[getPassability(location)].label}
              </span>
            </>
          )}
        </span>
      </span>
      {pending ? <PendingBadge className="shrink-0" /> : <StatusBadge status={location.status} className="shrink-0" />}
    </button>
  );
}
