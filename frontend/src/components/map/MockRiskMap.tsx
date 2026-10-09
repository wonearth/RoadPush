"use client";

/**
 * ⚠️ 개발용 MOCK 지도 — 신촌·이대 일대를 단순화한 SVG 지도.
 * 도로·건물 위치는 실제 지도와 정확히 일치하지 않는다.
 * 실제 지도 API 연결 시 RiskMap.tsx 에서 KakaoRiskMap 등으로 교체한다.
 */
import { useEffect, useRef, useState } from "react";
import { RISK_META } from "@/constants/risk";
import { cn } from "@/lib/cn";
import type { RiskMapProps } from "./types";

const VIEW = { width: 1000, height: 620 };
/** 항상 화면에 들어와야 하는 관심 영역 (신촌역 ~ 이대 정문) */
const FOCUS = { x: 70, y: 40, width: 880, height: 560 };

/** 컨테이너 비율에 맞춰 관심 영역 전체가 보이도록 viewBox 를 계산한다. 바깥은 지도 배경이 이어진다. */
function fitViewBox(aspect: number) {
  const focusAspect = FOCUS.width / FOCUS.height;
  if (aspect > focusAspect) {
    const width = FOCUS.height * aspect;
    return `${FOCUS.x - (width - FOCUS.width) / 2} ${FOCUS.y} ${width} ${FOCUS.height}`;
  }
  const height = FOCUS.width / aspect;
  return `${FOCUS.x} ${FOCUS.y - (height - FOCUS.height) / 2} ${FOCUS.width} ${height}`;
}
const BOUNDS = { north: 37.5615, south: 37.554, west: 126.934, east: 126.949 };

export function project(lat: number, lng: number) {
  return {
    x: ((lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * VIEW.width,
    y: ((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * VIEW.height,
  };
}

function Road({ d, width = 14 }: { d: string; width?: number }) {
  return (
    <g>
      <path d={d} stroke="#d4d4d8" strokeWidth={width + 3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke="#ffffff" strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function Station({ x, y, name }: { x: number; y: number; name: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={10} fill="#16a34a" stroke="white" strokeWidth={3} />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fill="white">
        2
      </text>
      <text x={x + 15} y={y + 4} fontSize={13} fontWeight={700} fill="#166534">
        {name}
      </text>
    </g>
  );
}

export function MockRiskMap({ locations, selectedId, onSelect, interactive = true, className }: RiskMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(VIEW.width / VIEW.height);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) setAspect(width / height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const sorted = [...locations].sort((a, b) => (a.id === selectedId ? 1 : b.id === selectedId ? -1 : 0));
  return (
    <div ref={ref} className={cn("relative overflow-hidden bg-[#f1f0ec]", className)}>
      <svg
        viewBox={fitViewBox(aspect)}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 size-full"
        role="img"
        aria-label="신촌·이대 일대 보행공간 단절 위험지도 (개발용)"
      >
        <defs>
          <pattern id="map-blocks" width="46" height="38" patternUnits="userSpaceOnUse">
            <rect width="46" height="38" fill="#f1f0ec" />
            <rect x="4" y="4" width="38" height="30" rx="2" fill="#e7e5df" />
          </pattern>
          <filter id="marker-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.3" />
          </filter>
        </defs>
        <rect x={-2000} y={-2000} width={5000} height={5000} fill="url(#map-blocks)" />

        {/* 녹지 / 캠퍼스 */}
        <path d="M-1500 -1500H260L235 120Q150 150 -1500 140Z" fill="#d9ead3" />
        <text x={70} y={70} fontSize={15} fontWeight={600} fill="#4d7c0f">
          연세대학교
        </text>
        <path d="M880 -1500H2500V330Q930 300 900 220L870 120Z" fill="#d9ead3" />
        <text x={900} y={190} fontSize={15} fontWeight={600} fill="#4d7c0f">
          이화여자대학교
        </text>

        {/* 이면도로 */}
        {[
          "M300 300L560 250",
          "M420 160L460 470",
          "M560 120L610 470",
          "M600 330L790 300",
          "M520 420L700 300",
          "M650 160L760 140",
          "M300 450L420 430",
          "M-1500 520L215 300",
        ].map((d) => (
          <Road key={d} d={d} width={7} />
        ))}
        {/* 주요 도로 */}
        <Road d="M-1500 900L193 520L800 397L2500 90" width={22} />
        <Road d="M70 1250L180 620L290 0L400 -650" width={16} />
        <Road d="M760 1300L800 397L830 220L860 0L900 -900" width={14} />
        <Road d="M226 395L420 350" width={10} />
        <Road d="M700 330L770 250L830 220" width={9} />

        <g fontSize={12} fill="#71717a" fontWeight={600}>
          <text x={470} y={455} transform="rotate(-11 470 455)">신촌로</text>
          <text x={262} y={170} transform="rotate(-80 262 170)">연세로</text>
          <text x={846} y={300} transform="rotate(-80 846 300)">이화여대길</text>
          <text x={300} y={372} transform="rotate(-12 300 372)">명물길</text>
          <text x={640} y={215}>대현동</text>
        </g>

        <Station {...project(37.5552, 126.9369)} name="신촌역" />
        <Station {...project(37.5567, 126.946)} name="이대역" />

        {/* 위험구간 marker */}
        {sorted.map((loc) => {
          const { x, y } = project(loc.latitude, loc.longitude);
          const selected = loc.id === selectedId;
          const color = RISK_META[loc.riskLevel].hex;
          const r = selected ? 21 : 16;
          return (
            <g
              key={loc.id}
              transform={`translate(${x} ${y})`}
              onClick={interactive ? () => onSelect?.(loc.id) : undefined}
              className={interactive ? "cursor-pointer" : undefined}
              role={interactive ? "button" : undefined}
              aria-label={`${loc.name} 위험도 ${loc.riskScore}`}
            >
              <title>{`${loc.name} · ${loc.riskScore}점 ${RISK_META[loc.riskLevel].label}`}</title>
              {selected && <circle r={r + 9} fill={color} opacity={0.2} />}
              <circle r={r} fill={color} stroke="white" strokeWidth={3} filter="url(#marker-shadow)" />
              <text y={selected ? 5 : 4.5} textAnchor="middle" fontSize={selected ? 15 : 12.5} fontWeight={700} fill="white" className="tabular">
                {loc.riskScore}
              </text>
              {selected && (
                <g transform={`translate(0 ${-r - 14})`}>
                  <rect x={-loc.name.length * 7 - 8} y={-13} width={loc.name.length * 14 + 16} height={22} rx={6} fill="#0f172a" />
                  <text y={2.5} textAnchor="middle" fontSize={12.5} fontWeight={700} fill="white">
                    {loc.name}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <span className="pointer-events-none absolute right-2 bottom-2 rounded bg-white/85 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
        예시 지도 (지도 API 미연결)
      </span>
    </div>
  );
}
