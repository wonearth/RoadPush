import { cn } from "@/lib/cn";
import type { OverlayLayers } from "../media/AnalysisOverlayLayer";

const ITEMS: { key: keyof OverlayLayers; label: string; swatch: string }[] = [
  { key: "walkable", label: "유효 보행공간", swatch: "bg-emerald-500" },
  { key: "detections", label: "장애물", swatch: "bg-rose-500" },
  { key: "segmentation", label: "보도·차도 구분", swatch: "bg-blue-500" },
  { key: "detour", label: "차도 우회 경로", swatch: "bg-red-600" },
];

export function LayerToggles({ layers, onChange }: { layers: OverlayLayers; onChange: (l: OverlayLayers) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="분석 결과 표시 레이어">
      {ITEMS.map(({ key, label, swatch }) => (
        <button
          key={key}
          type="button"
          aria-pressed={layers[key]}
          onClick={() => onChange({ ...layers, [key]: !layers[key] })}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-colors",
            layers[key] ? "bg-slate-100 text-slate-800" : "bg-slate-50 text-slate-400",
          )}
        >
          <span className={cn("size-2 rounded-sm", swatch, !layers[key] && "opacity-30")} />
          {label}
        </button>
      ))}
    </div>
  );
}
