/**
 * Kakao Maps JavaScript SDK 로더.
 * 한 번만 스크립트를 넣고, kakao.maps.load 완료 후 resolve 한다.
 * services 라이브러리(주소 검색·장소 검색·좌표→주소 변환)를 함께 불러온다.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    kakao?: any;
  }
}

export const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "";

let loading: Promise<any> | null = null;

export function loadKakaoMaps(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("브라우저에서만 사용할 수 있습니다."));
  if (!KAKAO_MAP_KEY) return Promise.reject(new Error("NEXT_PUBLIC_KAKAO_MAP_KEY 가 설정되지 않았습니다."));
  if (window.kakao?.maps?.LatLng) return Promise.resolve(window.kakao);
  if (loading) return loading;

  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => {
      if (!window.kakao?.maps) {
        loading = null;
        reject(new Error("카카오맵 SDK 를 불러오지 못했습니다. (도메인 등록·카카오맵 사용 설정 확인)"));
        return;
      }
      window.kakao.maps.load(() => resolve(window.kakao));
    };
    script.onerror = () => {
      loading = null;
      reject(new Error("카카오맵 SDK 를 불러오지 못했습니다."));
    };
    document.head.appendChild(script);
  });
  return loading;
}
