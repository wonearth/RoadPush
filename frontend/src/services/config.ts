import { isFirebaseConfigured } from "@/lib/firebase";

/**
 * 데이터 소스 선택.
 * - Firebase 환경변수가 모두 있으면 "firebase"
 * - 없거나 NEXT_PUBLIC_USE_MOCK=true 이면 "mock" (개발용 데이터)
 */
export const DATA_SOURCE: "firebase" | "mock" =
  process.env.NEXT_PUBLIC_USE_MOCK === "true" || !isFirebaseConfigured ? "mock" : "firebase";
