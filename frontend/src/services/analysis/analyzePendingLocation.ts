/**
 * AI 분석 대기 구간 분석 — Storage 에 있는 현장 사진을 한 장씩 AI 서버로 보내고,
 * 가장 위험한 사진의 결과를 구간 점수로 저장한다. (한 지점의 위험도 = 사진별 위험도 중 최댓값)
 */
import { analysisService, locationService } from "@/services";
import type { AnalysisResult, Location } from "@/types";

export async function analyzePendingLocation(
  location: Location,
  onProgress?: (done: number, total: number) => void,
): Promise<Location> {
  const photos = location.photos ?? [];
  if (!photos.length) throw new Error("분석할 현장 사진이 없습니다.");

  const results: (AnalysisResult | null)[] = [];
  for (const [i, photo] of photos.entries()) {
    onProgress?.(i, photos.length);
    // Storage 사진은 브라우저에서 직접 받을 수 없어 웹 서버 중계 경로로 받는다
    const res = await fetch(`/api/storage-image?url=${encodeURIComponent(photo.url)}`);
    if (!res.ok) throw new Error(`현장 사진을 불러오지 못했습니다 (${res.status})`);
    const blob = await res.blob();
    const file = new File([blob], `${photo.label ?? `photo-${i + 1}`}.jpg`, { type: blob.type || "image/jpeg" });
    try {
      const r = await analysisService.analyze({ file, mediaType: "image", originalImageUrl: photo.url });
      // 분석 시각이 아니라 촬영 시각을 기록한다 (발생 이력의 시간대 계산에 쓰인다)
      results.push({ ...r, analyzedAt: photo.takenAt });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      // 보도가 안 보이는 사진(422)만 건너뛰고 나머지로 판단한다. 서버 연결 문제는 바로 알린다
      if (!message.includes("(422)")) {
        throw new Error(e instanceof TypeError ? "AI 서버에 연결할 수 없습니다. 서버가 켜져 있는지 확인해 주세요." : message);
      }
      results.push(null);
    }
  }
  onProgress?.(photos.length, photos.length);

  const ok = results.filter((r): r is AnalysisResult => r !== null);
  if (!ok.length) throw new Error("모든 사진에서 보행공간을 찾지 못했습니다. 보도가 보이는 사진을 추가해 주세요.");
  const best = ok.reduce((a, b) => (b.riskScore > a.riskScore ? b : a));
  const photoScores = photos.map((p, i) => ({ label: p.label ?? `사진 ${i + 1}`, riskScore: results[i]?.riskScore ?? null }));
  return locationService.completePendingAnalysis(location.id, { ...best, photoScores });
}
