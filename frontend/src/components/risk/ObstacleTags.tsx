import { Bike, Car, Construction, Package } from "lucide-react";
import { OBSTACLE_META } from "@/constants/risk";
import { cn } from "@/lib/cn";
import type { ObstacleType } from "@/types";

export const OBSTACLE_ICON: Record<ObstacleType, typeof Car> = {
  ILLEGAL_PARKING: Car,
  CONSTRUCTION: Construction,
  STACKED_MATERIALS: Package,
  ABANDONED_PM: Bike,
};

export function ObstacleTags({
  types,
  className,
  size = "md",
}: {
  types: ObstacleType[];
  className?: string;
  size?: "sm" | "md";
}) {
  if (types.length === 0) {
    return <span className={cn("text-xs text-slate-400", className)}>주요 장애물 없음</span>;
  }
  return (
    <span className={cn("inline-flex flex-wrap gap-1", className)}>
      {types.map((t) => {
        const Icon = OBSTACLE_ICON[t];
        return (
          <span
            key={t}
            className={cn(
              "inline-flex items-center gap-1 rounded-md bg-slate-100 font-medium whitespace-nowrap text-slate-700",
              size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs",
            )}
          >
            <Icon className="size-3.5" style={{ color: OBSTACLE_META[t].hex }} aria-hidden />
            {OBSTACLE_META[t].label}
          </span>
        );
      })}
    </span>
  );
}
