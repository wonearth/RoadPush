import { LayoutDashboard, Map, ScanSearch } from "lucide-react";

export const ADMIN_NAV = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard, title: "대시보드" },
  { href: "/map", label: "위험지도", icon: Map, title: "위험지도" },
  { href: "/analysis", label: "AI 분석", icon: ScanSearch, title: "AI 분석" },
] as const;

export function getPageMeta(pathname: string) {
  if (pathname.startsWith("/account")) {
    return { title: "계정 설정" };
  }
  // 개발 서버 전용 화면 — 배포 사이트에서는 404 이므로 제목도 드러내지 않는다
  if (pathname.startsWith("/dev/") && process.env.NODE_ENV !== "production") {
    return { title: "현장 사진 일괄 등록" };
  }
  if (pathname.startsWith("/locations/")) {
    return { title: "위험구간 상세" };
  }
  return ADMIN_NAV.find((n) => pathname.startsWith(n.href)) ?? ADMIN_NAV[0];
}
