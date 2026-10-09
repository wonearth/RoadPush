import { departmentOf, dueOf } from "@/lib/admin";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { Location } from "@/types";

/** 처리기한 표시 (예: 10.12 · D-3, 기한이 지나면 경과 일수) */
export function DueText({ location, className }: { location: Location; className?: string }) {
  const due = dueOf(location);
  if (!due) return <span className={cn("text-slate-400", className)}>—</span>;
  return (
    <span className={cn("tabular whitespace-nowrap", className)}>
      {formatDate(due.due.toISOString()).slice(5)}
      <span className={cn("ml-1.5 font-semibold", due.overdue ? "text-[#c2410c]" : due.daysLeft <= 1 ? "text-[#c58a00]" : "text-slate-500")}>
        {due.label}
      </span>
    </span>
  );
}

/** 관리번호 · 담당 부서 · 처리기한 한 줄 */
export function AdminMeta({ location, className }: { location: Location; className?: string }) {
  const items = [
    ["관리번호", <span key="code" className="tabular">{location.code ?? "—"}</span>],
    ["담당", departmentOf(location)],
    ["처리기한", <DueText key="due" location={location} />],
  ] as const;
  return (
    <dl className={cn("flex flex-wrap gap-x-6 gap-y-1 text-sm", className)}>
      {items.map(([label, value]) => (
        <div key={label} className="flex items-baseline gap-2">
          <dt className="text-slate-400">{label}</dt>
          <dd className="font-medium text-slate-700">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
