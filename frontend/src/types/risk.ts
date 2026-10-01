/** 보행공간 단절 위험등급 (0~25 안전 / 26~50 주의 / 51~75 경고 / 76~100 위험) */
export type RiskLevel = "SAFE" | "CAUTION" | "WARNING" | "DANGER";

/** 위험구간 현장조치 상태 */
export type LocationStatus =
  | "NEW" // 신규 발견
  | "REVIEW_REQUIRED" // 확인 필요
  | "ACTION_PLANNED" // 조치 예정
  | "RESOLVED"; // 조치 완료

/** 보행공간을 잠식하는 장애요인 */
export type ObstacleType =
  | "ILLEGAL_PARKING" // 주정차 차량
  | "CONSTRUCTION" // 공사시설
  | "STACKED_MATERIALS" // 적치물
  | "ABANDONED_PM"; // 방치 자전거·PM

/** 현장조치 유형 */
export type ActionType =
  | "PARKING_ENFORCEMENT" // 주정차 관리
  | "CONSTRUCTION_CLEANUP" // 공사구간 정비
  | "MATERIAL_REMOVAL" // 적치물 제거
  | "PM_RELOCATION"; // 방치 PM 이동
