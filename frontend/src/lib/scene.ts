/**
 * 개발용 거리 장면(일러스트) 좌표계. 0~1 정규화 좌표, 16:10 비율.
 * mock overlay 생성기와 SceneIllustration 이 같은 기준을 공유한다.
 */
export const SCENE = {
  aspect: 16 / 10,
  roadBottom: 0.43,
  curbTop: 0.43,
  sidewalkTop: 0.455,
  sidewalkBottom: 0.86,
} as const;

export const SIDEWALK_HEIGHT = SCENE.sidewalkBottom - SCENE.sidewalkTop;

export function isMockMediaUrl(url: string | undefined | null): boolean {
  return !url || url.startsWith("mock://");
}
