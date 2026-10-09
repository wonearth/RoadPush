"use client";

import { facilityTag } from "@/constants/risk";
import { useNearbyFacilities } from "@/hooks/useNearbyFacilities";
import { cn } from "@/lib/cn";
import type { FacilityKind, Location } from "@/types";

// 어린이 시설 → 지하철역 → 병원 순으로 중요하게 본다
const ORDER: FacilityKind[] = ["CHILD", "SUBWAY", "HOSPITAL"];

/** 우선순위 이유 태그 — 구간 주변 지하철역·어린이 시설·병원 */
export function ReasonTags({ location, max, className }: { location: Location; max?: number; className?: string }) {
  const facilities = [...useNearbyFacilities(location)].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
  if (!facilities.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {facilities.slice(0, max).map((f) => (
        <li
          key={f.kind}
          className={cn(
            "rounded border px-1.5 py-px text-[13px] whitespace-nowrap",
            f.kind === "CHILD" ? "border-amber-300 text-amber-800" : "border-slate-300 text-slate-600",
          )}
        >
          {facilityTag(f)}
        </li>
      ))}
    </ul>
  );
}
