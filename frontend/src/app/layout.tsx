import type { Metadata } from "next";
import { AuthProvider } from "@/hooks/useAuth";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RoadPush — 보행공간 단절 AI 탐지",
    template: "%s | RoadPush",
  },
  description: "보행자를 차도로 밀어내는 길, 사고 전에 발견합니다. AI 기반 보행공간 단절 탐지 및 위험도 관리 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
