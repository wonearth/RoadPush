import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 서버 왼쪽 아래 Next.js 표시(N 아이콘)가 화면 글씨를 가려서 숨김. 컴파일·런타임 오류 안내는 그대로 표시된다.
  devIndicators: false,
};

export default nextConfig;
