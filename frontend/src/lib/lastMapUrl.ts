/**
 * 위험지도에서 마지막으로 본 주소(필터·선택 구간 포함).
 * 구간 상세의 '← 위험지도'가 필터를 풀지 않고 보던 목록으로 돌아가게 하는 데 쓴다.
 * 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 그냥 /map 으로 돌아간다.
 */
const KEY = "roadpush:last-map-url";

export function saveLastMapUrl(url: string) {
  try {
    sessionStorage.setItem(KEY, url);
  } catch {
    /* 저장 실패는 무시한다 */
  }
}

export function lastMapUrl() {
  try {
    const url = sessionStorage.getItem(KEY);
    return url?.startsWith("/map") ? url : "/map";
  } catch {
    return "/map";
  }
}
