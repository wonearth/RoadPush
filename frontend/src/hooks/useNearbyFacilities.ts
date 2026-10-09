"use client";

import { useEffect, useState } from "react";
import { findNearbyFacilities } from "@/components/map/kakaoGeo";
import { KAKAO_MAP_KEY } from "@/components/map/kakaoLoader";
import { locationService } from "@/services";
import type { Location, NearbyFacility } from "@/types";

/**
 * 구간 주변 시설(이유 태그). 저장된 값이 있으면 그대로 쓰고,
 * 없으면 카카오 장소 검색으로 한 번 찾아 구간에 저장해 둔다.
 */
export function useNearbyFacilities(location: Pick<Location, "id" | "latitude" | "longitude" | "nearbyFacilities">) {
  const { id, latitude, longitude, nearbyFacilities } = location;
  const [found, setFound] = useState<{ id: string; list: NearbyFacility[] } | null>(null);

  useEffect(() => {
    if (nearbyFacilities || !KAKAO_MAP_KEY) return;
    let active = true;
    findNearbyFacilities(latitude, longitude)
      .then((list) => {
        if (!active) return;
        setFound({ id, list });
        return locationService.saveNearbyFacilities(id, list);
      })
      // 검색·저장에 실패해도 태그만 안 보일 뿐 화면은 그대로 쓸 수 있다
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id, latitude, longitude, nearbyFacilities]);

  return nearbyFacilities ?? (found?.id === id ? found.list : []);
}
