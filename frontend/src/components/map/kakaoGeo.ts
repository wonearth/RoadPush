/**
 * 카카오 로컬 API(JavaScript SDK services) 래퍼 — 주소·장소 검색, 좌표 → 주소 변환.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FacilityKind, NearbyFacility } from "@/types";
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

function call<T>(fn: (cb: (result: T, status: string) => void) => void): Promise<{ result: T; ok: boolean }> {
  return new Promise((resolve) => fn((result, status) => resolve({ result, ok: status === "OK" })));
}

/** 주소 검색 → 결과 없으면 장소(키워드) 검색 (특정 지역을 우선하지 않는다) */
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
    places.keywordSearch(q, cb, { size: 7 }),
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

/** 어린이보호구역 판단에 쓰는 시설 이름 · 직선거리 기준. 어린이집은 골목마다 있어 거의 모든 구간에 붙으므로 뺀다. */
const CHILD_ZONE = [
  { match: /초등학교/, meters: 300 },
  { match: /유치원/, meters: 200 },
];

/** 저장된 어린이 시설이 지금 기준에도 맞는지 (기준을 바꾸기 전에 저장된 값을 걸러내는 데도 쓴다) */
export function isChildZoneFacility(f: NearbyFacility) {
  return f.kind !== "CHILD" || CHILD_ZONE.some((c) => c.match.test(f.name) && f.meters <= c.meters);
}

/** 시설 종류별 카카오 카테고리 · 검색 반경 · 이름 조건 */
const FACILITY_QUERIES: { kind: FacilityKind; code: string; radius: number; match?: RegExp; exclude?: RegExp }[] = [
  { kind: "SUBWAY", code: "SW8", radius: 200 },
  { kind: "CHILD", code: "SC4", radius: CHILD_ZONE[0].meters, match: CHILD_ZONE[0].match },
  { kind: "CHILD", code: "PS3", radius: CHILD_ZONE[1].meters, match: CHILD_ZONE[1].match },
  { kind: "HOSPITAL", code: "HP8", radius: 200, match: /병원/, exclude: /동물|한방|치과/ },
];

/** 구간 주변의 지하철역·어린이 시설·병원을 종류별로 가장 가까운 한 곳씩 찾는다. */
export async function findNearbyFacilities(latitude: number, longitude: number): Promise<NearbyFacility[]> {
  const kakao = await loadKakaoMaps();
  const places = new kakao.maps.services.Places();
  const location = new kakao.maps.LatLng(latitude, longitude);
  const found = await Promise.all(
    FACILITY_QUERIES.map(async (q) => {
      const { result, ok } = await call<any[]>((cb) =>
        places.categorySearch(q.code, cb, { location, radius: q.radius, sort: kakao.maps.services.SortBy.DISTANCE }),
      );
      const hit = ok ? result.find((r) => (!q.match || q.match.test(r.place_name)) && !q.exclude?.test(r.place_name)) : undefined;
      return hit ? { kind: q.kind, name: String(hit.place_name), meters: Number(hit.distance) } : null;
    }),
  );
  const nearest = new Map<FacilityKind, NearbyFacility>();
  found.forEach((f) => {
    if (f && (!nearest.has(f.kind) || f.meters < nearest.get(f.kind)!.meters)) nearest.set(f.kind, f);
  });
  return [...nearest.values()];
}
