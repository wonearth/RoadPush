"use client";

/**
 * 위험지도 진입점.
 * TODO(map): Kakao Map / Naver Map 연결 시
 *   1) components/map/KakaoRiskMap.tsx 를 RiskMapProps 계약대로 구현
 *      - SDK 로드: next/script 로 //dapi.kakao.com/v2/maps/sdk.js?appkey=...&autoload=false
 *      - marker: RISK_META[level].hex 색상의 CustomOverlay, 클릭 시 onSelect(id)
 *      - selectedId 변경 시 map.panTo(new kakao.maps.LatLng(lat, lng))
 *   2) 아래 MockRiskMap 을 KakaoRiskMap 으로 교체
 * 페이지 코드는 수정할 필요가 없다.
 */
import { MockRiskMap } from "./MockRiskMap";
import type { RiskMapProps } from "./types";

export function RiskMap(props: RiskMapProps) {
  return <MockRiskMap {...props} />;
}

export type { RiskMapProps };
