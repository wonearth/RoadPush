import type { Metadata } from "next";

export const metadata: Metadata = { title: "위험지도" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
