"use client";

/**
 * 위험구간 위치 지정: 주소·장소 검색 + 미니 지도에서 핀 위치 조정.
 * 핀이 움직이면 좌표와 함께 도로명주소·동 이름을 onChange 로 알려준다.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MapPin, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "../ui/Button";
import { inputClass } from "../ui/Field";
import { Spinner } from "../ui/States";
import { reverseGeocode, searchPlaces, type GeoPlace } from "./kakaoGeo";
import { loadKakaoMaps } from "./kakaoLoader";

export interface PickedLocation {
  latitude: number;
  longitude: number;
  address: string;
  area: string;
}

// 서울 전체에서 시작 → 검색하거나 확대해 위치 지정
const START = { lat: 37.5665, lng: 126.978, level: 8 };

export function LocationPicker({ onChange }: { onChange: (value: PickedLocation) => void }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoPlace[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<PickedLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** 핀을 옮기고 주소를 다시 찾는다. */
  const moveTo = async (lat: number, lng: number, knownAddress?: string) => {
    const kakao = window.kakao;
    if (!kakao || !mapRef.current) return;
    const pos = new kakao.maps.LatLng(lat, lng);
    if (!markerRef.current) {
      markerRef.current = new kakao.maps.Marker({ position: pos, draggable: true });
      markerRef.current.setMap(mapRef.current);
      kakao.maps.event.addListener(markerRef.current, "dragend", () => {
        const p = markerRef.current.getPosition();
        void moveTo(p.getLat(), p.getLng());
      });
    } else {
      markerRef.current.setPosition(pos);
    }
    const geo = await reverseGeocode(lat, lng).catch(() => null);
    const value = { latitude: lat, longitude: lng, address: knownAddress || geo?.address || "", area: geo?.area || "" };
    setPicked(value);
    onChangeRef.current(value);
  };

  useEffect(() => {
    let cancelled = false;
    loadKakaoMaps()
      .then((kakao) => {
        if (cancelled || !mapEl.current) return;
        const map = new kakao.maps.Map(mapEl.current, { center: new kakao.maps.LatLng(START.lat, START.lng), level: START.level });
        map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
        kakao.maps.event.addListener(map, "click", (e: any) => void moveTo(e.latLng.getLat(), e.latLng.getLng()));
        mapRef.current = map;
      })
      .catch(() => !cancelled && setError("지도를 불러오지 못했습니다."));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const found = await searchPlaces(query);
      setResults(found);
      if (found.length === 1) choose(found[0]);
    } catch {
      setError("검색에 실패했습니다.");
    } finally {
      setSearching(false);
    }
  };

  const choose = (place: GeoPlace) => {
    setResults(null);
    mapRef.current?.setLevel(2);
    mapRef.current?.setCenter(new window.kakao.maps.LatLng(place.latitude, place.longitude));
    void moveTo(place.latitude, place.longitude, place.address);
  };

  return (
    <div className="space-y-2">
      <span className="block text-[13px] font-semibold text-slate-700">위치</span>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void search();
              }
            }}
            placeholder="주소 또는 장소 검색 (예: 이화여대길 52, 이대역 2번출구)"
            className={cn(inputClass, "pl-9")}
            aria-label="주소 또는 장소 검색"
          />
        </div>
        <Button type="button" variant="secondary" onClick={() => void search()} disabled={searching}>
          {searching ? <Spinner /> : "검색"}
        </Button>
      </div>

      {results && (
        <ul className="max-h-40 overflow-y-auto rounded-xl bg-slate-50 text-sm">
          {results.length ? (
            results.map((r, i) => (
              <li key={`${r.label}-${i}`}>
                <button type="button" onClick={() => choose(r)} className="w-full px-3 py-2 text-left hover:bg-slate-50">
                  <span className="font-semibold text-slate-800">{r.label}</span>
                  {r.address !== r.label && <span className="ml-2 text-slate-500">{r.address}</span>}
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-3 text-slate-500">검색 결과가 없습니다.</li>
          )}
        </ul>
      )}

      <div className="relative h-56 overflow-hidden rounded-xl">
        <div ref={mapEl} className="absolute inset-0" />
        {!picked && (
          <p className="pointer-events-none absolute inset-x-0 bottom-2 z-10 mx-auto w-fit rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
            검색하거나 지도를 클릭해 위치를 지정하세요
          </p>
        )}
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      {picked && (
        <p className="flex items-start gap-1.5 text-xs text-slate-600">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
          <span>
            {picked.address || "주소 정보 없음"}
            {picked.area && <span className="text-slate-400"> · {picked.area}</span>}
            <span className="tabular ml-1 text-slate-400">
              ({picked.latitude.toFixed(5)}, {picked.longitude.toFixed(5)})
            </span>
            <span className="block text-slate-400">핀을 끌거나 지도를 클릭해 보도 위치를 정확히 맞출 수 있습니다.</span>
          </span>
        </p>
      )}
    </div>
  );
}
