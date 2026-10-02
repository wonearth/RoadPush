/**
 * 카카오 로컬 API(JavaScript SDK services) 래퍼 — 주소·장소 검색, 좌표 → 주소 변환.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { loadKakaoMaps } from "./kakaoLoader";

export interface GeoPlace {
  /** 목록에 보여줄 이름 (장소명 또는 주소) */
  label: string;
  /** 도로명주소 우선, 없으면 지번주소 */
  address: string;
  latitude: number;
  longitude: number;
}

export interface GeoAddress {
  address: string;
  /** 행정동·법정동 이름 (예: 대현동) */
  area: string;
}

// 신촌·이대 생활권 중심 — 장소 검색 결과를 이 근처로 우선 정렬
const SEARCH_CENTER = { lat: 37.5575, lng: 126.9415 };

function call<T>(fn: (cb: (result: T, status: string) => void) => void): Promise<{ result: T; ok: boolean }> {
  return new Promise((resolve) => fn((result, status) => resolve({ result, ok: status === "OK" })));
}

/** 주소 검색 → 결과 없으면 장소(키워드) 검색 */
export async function searchPlaces(query: string): Promise<GeoPlace[]> {
  const kakao = await loadKakaoMaps();
  const q = query.trim();
  if (!q) return [];

  const geocoder = new kakao.maps.services.Geocoder();
  const byAddress = await call<any[]>((cb) => geocoder.addressSearch(q, cb, { size: 5 }));
  if (byAddress.ok && byAddress.result.length) {
    return byAddress.result.map((r) => ({
      label: r.address_name,
      address: r.road_address?.address_name || r.address_name,
      latitude: Number(r.y),
      longitude: Number(r.x),
    }));
  }

  const places = new kakao.maps.services.Places();
  const byKeyword = await call<any[]>((cb) =>
    places.keywordSearch(q, cb, {
      location: new kakao.maps.LatLng(SEARCH_CENTER.lat, SEARCH_CENTER.lng),
      size: 7,
    }),
  );
  if (!byKeyword.ok) return [];
  return byKeyword.result.map((r) => ({
    label: r.place_name,
    address: r.road_address_name || r.address_name,
    latitude: Number(r.y),
    longitude: Number(r.x),
  }));
}

/** 좌표 → 주소·동 이름 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeoAddress | null> {
  const kakao = await loadKakaoMaps();
  const geocoder = new kakao.maps.services.Geocoder();
  const { result, ok } = await call<any[]>((cb) => geocoder.coord2Address(longitude, latitude, cb));
  if (!ok || !result.length) return null;
  const r = result[0];
  return {
    address: r.road_address?.address_name || r.address?.address_name || "",
    area: r.address?.region_3depth_name || "",
  };
}
