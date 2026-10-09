import { OBSTACLE_META } from "@/constants/risk";
import type { ObstacleType } from "@/types";

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(iso: string): string {
  return formatDateTime(iso).slice(0, 10);
}

export function formatObstacles(types: ObstacleType[], separator = " + "): string {
  if (types.length === 0) return "주요 장애물 없음";
  return types.map((t) => OBSTACLE_META[t].label).join(separator);
}

/** 관리자가 "왜 위험한가"를 한 문장으로 이해할 수 있도록 요약한다. */
export function describeRisk(input: {
  obstacleTypes: ObstacleType[];
  obstructionRatio: number;
  roadDetourRequired: boolean;
}): string {
  const { obstacleTypes, obstructionRatio, roadDetourRequired } = input;
  if (obstacleTypes.length === 0) {
    return "보행을 방해하는 주요 장애요인이 없으며 보행공간이 연속적으로 이어집니다.";
  }
  const cause = obstacleTypes.map((t) => OBSTACLE_META[t].label).join("·");
  const tail = roadDetourRequired
    ? "보행자가 차도로 내려가 우회해야 합니다."
    : "보행은 가능하지만 통행 폭이 좁아졌습니다.";
  return `${cause} 때문에 보행공간의 ${formatPercent(obstructionRatio)}가 잠식되어 ${tail}`;
}

/** 목록용 짧은 주소: 앞의 시·도·구 단위를 빼고 도로명·장소만 남긴다. */
export function shortAddress(address: string): string {
  const parts = address.trim().split(/\s+/);
  let i = 0;
  while (i < parts.length - 1 && i < 2 && /(특별시|광역시|특별자치시|도|시|구|군|서울)$/.test(parts[i])) i++;
  return parts.slice(i).join(" ");
}

/** 위치 정보로 구간명을 제안한다. 예: "대현동 이화여대길 구간" */
export function suggestLocationName(input: { address: string; area?: string }): string {
  const road = input.address.split(/\s+/).find((t) => /^[가-힣0-9]+(로|길)$/.test(t) && !/^\d/.test(t));
  const parts = [input.area, road].filter(Boolean);
  return parts.length ? `${parts.join(" ")} 구간` : "";
}
