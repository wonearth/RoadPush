import { LayoutDashboard, Map, ScanSearch } from "lucide-react";

export const ADMIN_NAV = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard, title: "대시보드", description: "우선점검이 필요한 구간을 확인합니다" },
  { href: "/map", label: "위험지도", icon: Map, title: "보행공간 단절 위험지도", description: "분석된 구간의 위치와 위험도를 확인합니다" },
  { href: "/analysis", label: "AI 분석", icon: ScanSearch, title: "AI 보행공간 분석", description: "도로·보행 영상을 업로드해 보행공간 단절을 분석합니다" },
] as const;

export function getPageMeta(pathname: string) {
  if (pathname.startsWith("/account")) {
    return { title: "계정 설정", description: "내 정보와 비밀번호를 관리합니다" };
  }
  if (pathname.startsWith("/locations/")) {
    return { title: "위험구간 상세", description: "분석 결과와 현장조치, 조치 전·후 개선효과를 관리합니다" };
  }
  return ADMIN_NAV.find((n) => pathname.startsWith(n.href)) ?? ADMIN_NAV[0];
}
