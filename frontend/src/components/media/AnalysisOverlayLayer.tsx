/**
 * AI 분석 결과 overlay.
 * - 보도/차도 segmentation
 * - 장애물 bounding box
 * - 실제 남아 있는 유효 보행공간
 * - 차도 우회(이탈) 경로
 * 실제 모델 연결 후에도 동일한 AnalysisOverlay 형식을 받아 그대로 그린다.
 */
import { useId } from "react";
import { OBSTACLE_META } from "@/constants/risk";
import type { AnalysisOverlay, NormalizedPolygon } from "@/types";

const W = 160;
const H = 100;

export interface OverlayLayers {
  segmentation: boolean;
  walkable: boolean;
  detections: boolean;
  detour: boolean;
}

export const DEFAULT_LAYERS: OverlayLayers = { segmentation: true, walkable: true, detections: true, detour: true };

const toPoints = (poly: NormalizedPolygon) => poly.map(([x, y]) => `${x * W},${y * H}`).join(" ");

function bounds(poly: NormalizedPolygon) {
  const ys = poly.map((p) => p[1] * H);
  const xs = poly.map((p) => p[0] * W);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

function Label({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  const width = text.length * 2.9 + 3;
  return (
    <g>
      <rect x={x} y={y - 4.4} width={width} height={4.8} rx={0.8} fill={color} />
      <text x={x + 1.5} y={y - 0.9} fontSize={3.2} fontWeight={700} fill="white">
        {text}
      </text>
    </g>
  );
}

export function AnalysisOverlayLayer({
  overlay,
  layers = DEFAULT_LAYERS,
  walkableRatio,
  roadDetourRequired,
}: {
  overlay: AnalysisOverlay;
  layers?: OverlayLayers;
  walkableRatio?: number;
  roadDetourRequired?: boolean;
}) {
  const maskId = useId();
  const arrowId = useId();
  const side = bounds(overlay.sidewalkRegion);
  const road = bounds(overlay.roadRegion);
  const main = overlay.detections[0];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full">
      <defs>
        <mask id={maskId}>
          <polygon points={toPoints(overlay.sidewalkRegion)} fill="white" />
          {overlay.detections.map((d) => (
            <rect key={d.id} x={d.box.x * W} y={d.box.y * H} width={d.box.width * W} height={d.box.height * H} fill="black" />
          ))}
        </mask>
        <marker id={arrowId} viewBox="0 0 6 6" refX="3" refY="3" markerWidth="4" markerHeight="4" orient="auto">
          <path d="M0 0L6 3L0 6z" fill="#dc2626" />
        </marker>
      </defs>

      {layers.segmentation && (
        <g>
          <polygon points={toPoints(overlay.roadRegion)} fill="#0f172a" opacity={0.28} />
          <polygon
            points={toPoints(overlay.sidewalkRegion)}
            fill="#3b82f6"
            fillOpacity={0.12}
            stroke="#2563eb"
            strokeWidth={0.6}
            strokeDasharray="2 1.2"
          />
          <Label x={road.minX + 2} y={road.minY + 7} text="차도" color="#334155" />
          <Label x={side.maxX - 12} y={side.maxY - 2} text="보도" color="#2563eb" />
        </g>
      )}

      {layers.walkable &&
        (overlay.walkableRegions?.length ? (
          overlay.walkableRegions.map((poly, i) => (
            <polygon key={i} points={toPoints(poly)} fill="#10b981" fillOpacity={0.5} />
          ))
        ) : (
          <polygon points={toPoints(overlay.sidewalkRegion)} fill="#10b981" fillOpacity={0.5} mask={`url(#${maskId})`} />
        ))}
      {layers.walkable && walkableRatio !== undefined && (
        <Label
          x={side.minX + 2}
          y={side.maxY - 2}
          text={`유효 보행공간 ${Math.round(walkableRatio * 100)}%`}
          color="#059669"
        />
      )}

      {layers.detections &&
        overlay.detections.map((d) => {
          const color = OBSTACLE_META[d.type].hex;
          const x = d.box.x * W;
          const y = d.box.y * H;
          return (
            <g key={d.id}>
              <rect
                x={x}
                y={y}
                width={d.box.width * W}
                height={d.box.height * H}
                fill={color}
                fillOpacity={0.14}
                stroke={color}
                strokeWidth={0.8}
              />
              <Label x={x} y={y} text={OBSTACLE_META[d.type].label} color={color} />
            </g>
          );
        })}

      {layers.detour && roadDetourRequired && main && (
        <path
          d={(() => {
            const x0 = Math.max(main.box.x * W - 10, 2);
            const x1 = Math.min((main.box.x + main.box.width) * W + 10, W - 2);
            const yWalk = (side.minY + side.maxY) / 2 + 6;
            const yRoad = road.maxY - 6;
            return `M ${x0} ${yWalk} C ${x0 + 4} ${yRoad}, ${x0 + 6} ${yRoad}, ${(x0 + x1) / 2} ${yRoad} S ${x1 - 4} ${yRoad}, ${x1} ${yWalk}`;
          })()}
          fill="none"
          stroke="#dc2626"
          strokeWidth={1}
          strokeDasharray="2.2 1.4"
          markerEnd={`url(#${arrowId})`}
        />
      )}
    </svg>
  );
}
