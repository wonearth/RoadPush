"use client";

import { Baby, Hospital, TrainFront } from "lucide-react";
import { facilityTag } from "@/constants/risk";
import { useNearbyFacilities } from "@/hooks/useNearbyFacilities";
import { cn } from "@/lib/cn";
import type { FacilityKind, Location } from "@/types";

const ICON: Record<FacilityKind, typeof TrainFront> = { SUBWAY: TrainFront, CHILD: Baby, HOSPITAL: Hospital };
// 어린이 시설 → 지하철역 → 병원 순으로 중요하게 본다
const ORDER: FacilityKind[] = ["CHILD", "SUBWAY", "HOSPITAL"];

/** 우선순위 이유 태그 — 구간 주변 지하철역·어린이 시설·병원 */
export function ReasonTags({ location, max, className }: { location: Location; max?: number; className?: string }) {
  const facilities = [...useNearbyFacilities(location)].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
  if (!facilities.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {facilities.slice(0, max).map((f) => {
        const Icon = ICON[f.kind];
        return (
          <li
            key={f.kind}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[13px] font-semibold whitespace-nowrap",
              f.kind === "CHILD" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600",
            )}
          >
            <Icon className="size-3.5" />
            {facilityTag(f)}
          </li>
        );
      })}
    </ul>
  );
}
