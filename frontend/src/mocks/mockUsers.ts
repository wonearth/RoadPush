/**
 * ⚠️ 개발용 MOCK 계정 — Firebase Authentication 연결 전 UI 흐름 확인용.
 * 실제 서비스에서는 비밀번호를 클라이언트에 저장하지 않는다.
 */
import type { User } from "@/types";

export interface MockUserRecord extends User {
  password: string;
}

export const MOCK_DEMO_ACCOUNT = {
  email: "admin@roadpush.dev",
  password: "roadpush2026",
};

export const MOCK_USERS: MockUserRecord[] = [
  {
    uid: "mock-user-admin",
    name: "데모 관리자",
    organization: "서대문구청 도로과 (예시)",
    email: MOCK_DEMO_ACCOUNT.email,
    password: MOCK_DEMO_ACCOUNT.password,
    createdAt: "2026-09-01T09:00:00+09:00",
  },
];
