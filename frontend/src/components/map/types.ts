import type { Location } from "@/types";

/**
 * 지도 컴포넌트 공통 props.
 * Mock 지도와 Kakao/Naver 지도 구현체가 모두 이 계약을 따른다.
 */
export interface RiskMapProps {
  locations: Location[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** false 면 marker 클릭을 막는다 (대시보드 미리보기 등) */
  interactive?: boolean;
  className?: string;
}
