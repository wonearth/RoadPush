/**
 * ⚠️ 개발용 MOCK — 실제 AI 출력이 아니다.
 * 장애요인 목록과 공간 잠식률로부터 화면 표시용 가상의 segmentation / bounding box 를 만든다.
 * FastAPI 연결 후에는 서버가 내려주는 overlay 를 그대로 사용한다.
 */
import { SCENE, SIDEWALK_HEIGHT } from "@/lib/scene";
import type { AnalysisOverlay, Detection, ObstacleType } from "@/types";

const WIDTH: Record<ObstacleType, number> = {
  ILLEGAL_PARKING: 0.27,
  CONSTRUCTION: 0.24,
  STACKED_MATERIALS: 0.13,
  ABANDONED_PM: 0.1,
};

function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function generateMockOverlay(
  obstacleTypes: ObstacleType[],
  obstructionRatio: number,
  seed: string,
): AnalysisOverlay {
  const rand = seededRandom(seed);
  const n = obstacleTypes.length;
  const detections: Detection[] = obstacleTypes.map((type, i) => {
    // 첫 번째 장애물이 가장 좁은 지점(= 공간 잠식률)을 만든다.
    const depthRatio = i === 0 ? obstructionRatio : obstructionRatio * (0.55 + rand() * 0.3);
    const width = WIDTH[type];
    const slot = 1 / n;
    const center = slot * i + slot / 2 + (rand() - 0.5) * slot * 0.25;
    const x = Math.min(Math.max(center - width / 2, 0.03), 0.97 - width);
    const depth = SIDEWALK_HEIGHT * depthRatio;
    const top = type === "ILLEGAL_PARKING" ? SCENE.sidewalkTop - 0.15 : SCENE.sidewalkTop;
    return {
      id: `${seed}-det-${i}`,
      type,
      box: { x, y: top, width, height: SCENE.sidewalkTop + depth - top },
      confidence: Math.round((0.82 + rand() * 0.15) * 100) / 100,
    };
  });

  return {
    roadRegion: [
      [0, 0],
      [1, 0],
      [1, SCENE.roadBottom],
      [0, SCENE.roadBottom],
    ],
    sidewalkRegion: [
      [0, SCENE.sidewalkTop],
      [1, SCENE.sidewalkTop],
      [1, SCENE.sidewalkBottom],
      [0, SCENE.sidewalkBottom],
    ],
    detections,
  };
}

/** AI 분석 화면의 "샘플 이미지로 체험"에 쓰는 개발용 예시 장면 */
export const MOCK_SAMPLE_SCENE_URL = "mock://scene/sample";
export const MOCK_SAMPLE_OVERLAY = generateMockOverlay(["ILLEGAL_PARKING", "CONSTRUCTION"], 0.69, MOCK_SAMPLE_SCENE_URL);
