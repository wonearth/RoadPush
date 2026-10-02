/**
 * Firestore 저장 형식 변환.
 * Firestore 는 배열 안의 배열(nested array)을 저장할 수 없으므로
 * overlay 의 polygon 좌표 [x, y][] 를 { x, y }[] 로 바꿔 저장한다.
 */
import type { AnalysisOverlay, AnalysisResult, NormalizedPolygon } from "@/types";

type StoredPoint = { x: number; y: number };
type StoredPolygon = StoredPoint[];

export interface StoredOverlay {
  roadRegion: StoredPolygon;
  sidewalkRegion: StoredPolygon;
  walkableRegions?: { points: StoredPolygon }[];
  detections: AnalysisOverlay["detections"];
}

export type StoredAnalysisResult = Omit<AnalysisResult, "id" | "overlay"> & { overlay: StoredOverlay | null };

const toStoredPolygon = (poly: NormalizedPolygon): StoredPolygon => poly.map(([x, y]) => ({ x, y }));
const fromStoredPolygon = (poly: StoredPolygon): NormalizedPolygon => poly.map(({ x, y }) => [x, y]);

export function toStoredAnalysis(result: AnalysisResult): StoredAnalysisResult {
  const { id: _id, overlay, ...rest } = result;
  void _id;
  return {
    ...rest,
    overlay: overlay && {
      roadRegion: toStoredPolygon(overlay.roadRegion),
      sidewalkRegion: toStoredPolygon(overlay.sidewalkRegion),
      walkableRegions: overlay.walkableRegions?.map((p) => ({ points: toStoredPolygon(p) })),
      detections: overlay.detections,
    },
  };
}

export function fromStoredAnalysis(id: string, data: StoredAnalysisResult): AnalysisResult {
  const { overlay, ...rest } = data;
  return {
    id,
    ...rest,
    overlay: overlay && {
      roadRegion: fromStoredPolygon(overlay.roadRegion),
      sidewalkRegion: fromStoredPolygon(overlay.sidewalkRegion),
      walkableRegions: overlay.walkableRegions?.map((p) => fromStoredPolygon(p.points)),
      detections: overlay.detections,
    },
  };
}
