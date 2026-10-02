"use client";

/**
 * 위험지도 진입점.
 * - NEXT_PUBLIC_KAKAO_MAP_KEY 가 있으면 카카오맵(KakaoRiskMap)
 * - 키가 없거나 SDK 로딩에 실패하면 개발용 SVG 지도(MockRiskMap)
 * 페이지는 RiskMapProps 계약만 사용하므로 지도 구현을 바꿔도 수정할 필요가 없다.
 */
import { useState } from "react";
import { KAKAO_MAP_KEY } from "./kakaoLoader";
import { KakaoRiskMap } from "./KakaoRiskMap";
import { MockRiskMap } from "./MockRiskMap";
import type { RiskMapProps } from "./types";

export function RiskMap(props: RiskMapProps) {
  const [failed, setFailed] = useState(false);
  if (!KAKAO_MAP_KEY || failed) return <MockRiskMap {...props} />;
  return (
    <KakaoRiskMap
      {...props}
      onError={(e) => {
        console.warn("[RiskMap] 카카오맵을 불러오지 못해 개발용 지도로 대체합니다:", e.message);
        setFailed(true);
      }}
    />
  );
}

export type { RiskMapProps };
