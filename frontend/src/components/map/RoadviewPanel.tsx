"use client";

/**
 * 카카오 로드뷰 — 구간 좌표에서 가장 가까운 로드뷰 지점을 보여준다.
 * 사진만으로는 판단하기 어려운 주변 맥락(관행적으로 쓰이는 길인지 등)을 확인하는 용도.
 */
import { ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { KAKAO_MAP_KEY, loadKakaoMaps } from "./kakaoLoader";

/** 이 거리 안에 로드뷰 지점이 없으면 '없음'으로 본다 */
const SEARCH_RADIUS_M = 50;

/** 두 좌표 사이 방위각(도, 북=0) — 로드뷰 시선을 구간 쪽으로 돌릴 때 쓴다 */
function bearing(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(rad(to.lng - from.lng)) * Math.cos(rad(to.lat));
  const x = Math.cos(rad(from.lat)) * Math.sin(rad(to.lat)) - Math.sin(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.cos(rad(to.lng - from.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function RoadviewPanel({ latitude, longitude }: { latitude: number; longitude: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "none" | "error">(KAKAO_MAP_KEY ? "loading" : "error");

  useEffect(() => {
    if (!KAKAO_MAP_KEY) return;
    let cancelled = false;
    loadKakaoMaps()
      .then((kakao) => {
        if (cancelled || !ref.current) return;
        const target = new kakao.maps.LatLng(latitude, longitude);
        const roadview = new kakao.maps.Roadview(ref.current);
        new kakao.maps.RoadviewClient().getNearestPanoId(target, SEARCH_RADIUS_M, (panoId: number | null) => {
          if (cancelled) return;
          if (panoId === null) return setState("none");
          roadview.setPanoId(panoId, target);
          // 로드뷰 지점에서 구간 쪽을 바라보도록 시선을 맞춘다
          kakao.maps.event.addListener(roadview, "init", () => {
            const p = roadview.getPosition();
            const pan = bearing({ lat: p.getLat(), lng: p.getLng() }, { lat: latitude, lng: longitude });
            roadview.setViewpoint({ pan, tilt: 0, zoom: 0 });
            setState("ready");
          });
        });
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  return (
    <div>
      <div className="relative h-72 overflow-hidden rounded-xl bg-slate-100 sm:h-96">
        <div ref={ref} className="size-full" />
        {state !== "ready" && (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-slate-500">
            {state === "loading"
              ? "로드뷰를 불러오는 중…"
              : state === "none"
                ? `이 위치 반경 ${SEARCH_RADIUS_M}m 안에는 로드뷰가 없습니다.`
                : "로드뷰를 불러오지 못했습니다."}
          </p>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>카카오 로드뷰는 촬영 시점이 현재와 다를 수 있습니다.</span>
        <a
          href={`https://map.kakao.com/link/roadview/${latitude},${longitude}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900"
        >
          카카오맵에서 크게 보기 <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}
