/** 계정 해지 사유 */
export type DeactivationReason = "RETIRED" | "TRANSFERRED" | "ROLE_CHANGED" | "OTHER";

/**
 * 계정 해지 신청. 공공기관 계정은 본인이 바로 지우지 않고,
 * 신청 → 기관 관리자 승인 → 비활성화(이력 보존) 순서로 처리한다.
 */
export interface DeactivationRequest {
  reason: DeactivationReason;
  memo: string;
  requestedAt: string;
}

/** 관리자 계정. Firestore `users` 컬렉션 문서에 대응한다. */
export interface User {
  uid: string;
  name: string;
  organization: string;
  email: string;
  createdAt: string;
  /** 해지 신청 중이면 신청 내용 (기관 관리자 승인 대기) */
  deactivationRequest?: DeactivationRequest;
}

export interface SignUpInput {
  name: string;
  organization: string;
  email: string;
  password: string;
}
