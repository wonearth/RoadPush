"use client";

/**
 * Kakao Map 기반 위험지도. MockRiskMap 과 같은 RiskMapProps 계약을 따른다.
 * marker 는 위험등급 색상 + 위험도 점수가 들어간 CustomOverlay 로 그린다.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { RISK_META } from "@/constants/risk";
import { cn } from "@/lib/cn";
import type { Location } from "@/types";
import { loadKakaoMaps } from "./kakaoLoader";
import type { RiskMapProps } from "./types";

// 등록된 구간이 없을 때 보여줄 기본 범위: 서울 전체 (구간이 있으면 구간 위치에 자동으로 맞춘다)
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const DEFAULT_LEVEL = 9;

function markerElement(loc: Location, selected: boolean, interactive: boolean, onClick?: () => void) {
  const color = RISK_META[loc.riskLevel].hex;
  const size = selected ? 42 : 32;
  const el = document.createElement("div");
  el.style.cssText = "display:flex;flex-direction:column;align-items:center;transform:translateY(-4px);";

  if (selected) {
    const label = document.createElement("div");
    label.textContent = loc.name;
    label.style.cssText =
      "margin-bottom:6px;padding:3px 9px;border-radius:6px;background:#0f172a;color:#fff;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(15,23,42,.25);";
    el.appendChild(label);
  }

  const dot = document.createElement(interactive ? "button" : "div");
  dot.textContent = String(loc.riskScore);
  dot.setAttribute("aria-label", `${loc.name} 위험도 ${loc.riskScore}`);
  dot.title = `${loc.name} · ${loc.riskScore}점 ${RISK_META[loc.riskLevel].label}`;
  dot.style.cssText = [
    `width:${size}px`,
    `height:${size}px`,
    "border-radius:9999px",
    `background:${color}`,
    "border:3px solid #fff",
    `box-shadow:0 2px 6px rgba(15,23,42,.3)${selected ? `,0 0 0 8px ${color}33` : ""}`,
    "color:#fff",
    `font-size:${selected ? 15 : 12.5}px`,
    "font-weight:700",
    "font-variant-numeric:tabular-nums",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "padding:0",
    interactive ? "cursor:pointer" : "cursor:default",
  ].join(";");
  if (interactive && onClick) dot.addEventListener("click", onClick);
  el.appendChild(dot);
  return el;
}

export function KakaoRiskMap({
  locations,
  selectedId,
  onSelect,
  interactive = true,
  className,
  onError,
}: RiskMapProps & { onError?: (error: Error) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const fittedRef = useRef(false);
  const [ready, setReady] = useState(false);

  // 지도 생성
  useEffect(() => {
    let cancelled = false;
    loadKakaoMaps()
      .then((kakao) => {
        if (cancelled || !containerRef.current) return;
        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
          level: DEFAULT_LEVEL,
        });
        if (interactive) {
          map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
        } else {
          map.setDraggable(false);
          map.setZoomable(false);
        }
        mapRef.current = map;
        setReady(true);
      })
      .catch((e) => !cancelled && onError?.(e instanceof Error ? e : new Error(String(e))));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 모든 구간이 보이도록 범위를 맞춘다. 컨테이너 크기가 0이면 잘못된 확대 수준이 잡히므로 건너뛴다. */
  const fitToLocations = () => {
    const kakao = window.kakao;
    const map = mapRef.current;
    const el = containerRef.current;
    if (fittedRef.current || !kakao || !map || !el?.clientWidth || !el.clientHeight || !locations.length) return;
    map.relayout();
    const bounds = new kakao.maps.LatLngBounds();
    locations.forEach((l) => bounds.extend(new kakao.maps.LatLng(l.latitude, l.longitude)));
    map.setBounds(bounds, 60, 60, 60, 60);
    fittedRef.current = true;
  };

  // 컨테이너 크기 변화 시 지도 다시 맞춤
  useEffect(() => {
    const el = containerRef.current;
    if (!ready || !el) return;
    const ro = new ResizeObserver(() => {
      mapRef.current?.relayout();
      fitToLocations();
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, locations]);

  // marker 갱신
  useEffect(() => {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!ready || !kakao || !map) return;

    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = locations.map((loc) => {
      const selected = loc.id === selectedId;
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(loc.latitude, loc.longitude),
        content: markerElement(loc, selected, interactive, () => onSelect?.(loc.id)),
        yAnchor: 1,
        zIndex: selected ? 10 : 1,
        clickable: interactive,
      });
      overlay.setMap(map);
      return overlay;
    });

    // 처음 한 번은 모든 구간이 보이도록 범위를 맞춘다.
    fitToLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, locations, selectedId, interactive, onSelect]);

  // 선택한 구간으로 이동
  useEffect(() => {
    const kakao = window.kakao;
    const target = locations.find((l) => l.id === selectedId);
    if (!ready || !kakao || !mapRef.current || !target) return;
    mapRef.current.panTo(new kakao.maps.LatLng(target.latitude, target.longitude));
  }, [ready, selectedId, locations]);

  return (
    <div className={cn("relative isolate overflow-hidden bg-slate-100", className)}>
      <div ref={containerRef} className="absolute inset-0 z-0" />
    </div>
  );
}
