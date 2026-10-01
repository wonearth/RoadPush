/**
 * ⚠️ 개발용 거리 장면 일러스트.
 * 실제 촬영 이미지가 없는 mock 데이터에서 원본 이미지 자리를 채우기 위해 overlay 의 탐지 박스 위치에 장애물을 그린다.
 */
import { SCENE } from "@/lib/scene";
import type { Detection } from "@/types";

const W = 160;
const H = 100;

function Obstacle({ d }: { d: Detection }) {
  const x = d.box.x * W;
  const y = d.box.y * H;
  const w = d.box.width * W;
  const h = d.box.height * H;
  switch (d.type) {
    case "ILLEGAL_PARKING":
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={3.5} fill="#1e293b" />
          <rect x={x + w * 0.2} y={y + h * 0.12} width={w * 0.6} height={h * 0.76} rx={2.5} fill="#475569" />
          <rect x={x + w * 0.1} y={y + h * 0.16} width={w * 0.1} height={h * 0.68} rx={1} fill="#bfdbfe" opacity={0.85} />
          <rect x={x + w * 0.8} y={y + h * 0.16} width={w * 0.08} height={h * 0.68} rx={1} fill="#bfdbfe" opacity={0.7} />
          <rect x={x + w * 0.14} y={y - 0.8} width={w * 0.14} height={1.6} rx={0.6} fill="#0f172a" />
          <rect x={x + w * 0.72} y={y - 0.8} width={w * 0.14} height={1.6} rx={0.6} fill="#0f172a" />
          <rect x={x + w * 0.14} y={y + h - 0.8} width={w * 0.14} height={1.6} rx={0.6} fill="#0f172a" />
          <rect x={x + w * 0.72} y={y + h - 0.8} width={w * 0.14} height={1.6} rx={0.6} fill="#0f172a" />
        </g>
      );
    case "CONSTRUCTION":
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} fill="#fef3c7" opacity={0.7} />
          <rect x={x} y={y + h - 3} width={w} height={3} fill="url(#rp-hazard)" />
          <rect x={x + w - 2.4} y={y} width={2.4} height={h} fill="url(#rp-hazard)" />
          <rect x={x + 3} y={y + 3} width={w * 0.35} height={h * 0.3} fill="#a8a29e" />
          <rect x={x + w * 0.45} y={y + h * 0.35} width={w * 0.25} height={h * 0.22} fill="#78716c" />
          {[0.18, 0.5, 0.82].map((p) => (
            <polygon
              key={p}
              points={`${x + w * p - 2},${y + h - 3.5} ${x + w * p + 2},${y + h - 3.5} ${x + w * p},${y + h - 9}`}
              fill="#f97316"
            />
          ))}
        </g>
      );
    case "STACKED_MATERIALS":
      return (
        <g>
          <rect x={x + 1} y={y + 1} width={w * 0.55} height={h * 0.5} fill="#b45309" />
          <rect x={x + w * 0.45} y={y + h * 0.3} width={w * 0.5} height={h * 0.6} fill="#d97706" />
          <rect x={x + w * 0.1} y={y + h * 0.55} width={w * 0.4} height={h * 0.4} fill="#92400e" />
          <line x1={x + w * 0.7} y1={y + h * 0.3} x2={x + w * 0.7} y2={y + h * 0.9} stroke="#fde68a" strokeWidth={0.8} />
        </g>
      );
    case "ABANDONED_PM":
      return (
        <g stroke="#334155" strokeWidth={1.2} strokeLinecap="round" fill="none">
          <line x1={x + w * 0.15} y1={y + h * 0.2} x2={x + w * 0.85} y2={y + h * 0.55} stroke="#16a34a" strokeWidth={2.4} />
          <line x1={x + w * 0.8} y1={y + h * 0.4} x2={x + w * 0.9} y2={y + h * 0.7} />
          <circle cx={x + w * 0.3} cy={y + h * 0.78} r={w * 0.16} />
          <circle cx={x + w * 0.75} cy={y + h * 0.78} r={w * 0.16} />
          <line x1={x + w * 0.3} y1={y + h * 0.78} x2={x + w * 0.55} y2={y + h * 0.62} />
          <line x1={x + w * 0.55} y1={y + h * 0.62} x2={x + w * 0.75} y2={y + h * 0.78} />
        </g>
      );
  }
}

export function SceneIllustration({ detections, className }: { detections: Detection[]; className?: string }) {
  const sidewalkTop = SCENE.sidewalkTop * H;
  const sidewalkBottom = SCENE.sidewalkBottom * H;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} role="img" aria-label="개발용 예시 거리 장면">
      <defs>
        <pattern id="rp-tiles" width="8" height="5" patternUnits="userSpaceOnUse">
          <rect width="8" height="5" fill="#e7e5e4" />
          <path d="M0 0H8M0 0V5" stroke="#d6d3d1" strokeWidth="0.35" />
        </pattern>
        <pattern id="rp-hazard" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="3" height="3" fill="#ffffff" />
          <rect width="1.5" height="3" fill="#f97316" />
        </pattern>
      </defs>
      {/* 차도 */}
      <rect width={W} height={SCENE.roadBottom * H} fill="#57534e" />
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={i * 19 + 3} y={19.5} width={10} height={1.2} fill="#fafaf9" opacity={0.85} />
      ))}
      <rect y={4} width={W} height={0.6} fill="#facc15" opacity={0.8} />
      <rect y={5.3} width={W} height={0.6} fill="#facc15" opacity={0.8} />
      {/* 연석 */}
      <rect y={SCENE.curbTop * H} width={W} height={sidewalkTop - SCENE.curbTop * H} fill="#cbd5e1" />
      {/* 보도 */}
      <rect y={sidewalkTop} width={W} height={sidewalkBottom - sidewalkTop} fill="url(#rp-tiles)" />
      <rect y={sidewalkTop + (sidewalkBottom - sidewalkTop) * 0.62} width={W} height={2.6} fill="#fbbf24" opacity={0.75} />
      {/* 건물 */}
      <rect y={sidewalkBottom} width={W} height={H - sidewalkBottom} fill="#94a3b8" />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={i * 20 + 3} y={sidewalkBottom + 3} width={14} height={H - sidewalkBottom - 3} fill="#cbd5e1" />
      ))}
      {/* 가로수 */}
      {[22, 88, 142].map((x) => (
        <g key={x}>
          <circle cx={x} cy={sidewalkTop + 3} r={5.5} fill="#4d7c0f" opacity={0.85} />
          <circle cx={x} cy={sidewalkTop + 3} r={1.2} fill="#3f2a14" />
        </g>
      ))}
      {detections.map((d) => (
        <Obstacle key={d.id} d={d} />
      ))}
    </svg>
  );
}
