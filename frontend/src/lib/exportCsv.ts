/** 위험구간 목록 CSV 내보내기 — 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM 을 붙인다. */
import { OBSTACLE_META, PASSABILITY_META, RISK_META, STATUS_META, getPassability } from "@/constants/risk";
import type { Location } from "@/types";
import { departmentOf, dueOf } from "./admin";
import { formatDate, formatDateTime, formatPercent } from "./format";

const escape = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function locationsToCsv(locations: Location[]): string {
  const header = [
    "관리번호", "구간명", "주소", "생활권", "위험도", "위험등급", "주요 원인", "유효 보행공간", "통행 판단",
    "조치상태", "담당 부서", "처리기한", "최근 분석 일시", "위도", "경도",
  ];
  const rows = locations.map((l) => {
    const due = dueOf(l);
    return [
      l.code ?? "",
      l.name,
      l.address,
      l.area,
      l.riskScore,
      RISK_META[l.riskLevel].label,
      l.obstacleTypes.map((t) => OBSTACLE_META[t].label).join(", ") || "없음",
      formatPercent(l.walkableRatio),
      PASSABILITY_META[getPassability(l)].label,
      STATUS_META[l.status].label,
      departmentOf(l),
      due ? `${formatDate(due.due.toISOString())} (${due.label})` : "",
      formatDateTime(l.analyzedAt),
      l.latitude.toFixed(5),
      l.longitude.toFixed(5),
    ];
  });
  return "﻿" + [header, ...rows].map((r) => r.map(escape).join(",")).join("\r\n");
}

/** 브라우저에서 CSV 파일로 저장 */
export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}
