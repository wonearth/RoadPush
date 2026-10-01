import { ArrowRight, Footprints, X } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import type { Location } from "@/types";
import { ObstacleTags } from "../risk/ObstacleTags";
import { RiskScore, StatusBadge } from "../risk/RiskBadge";
import { WalkableBar } from "../risk/RiskBar";
import { ButtonLink } from "../ui/Button";

/** 지도 marker 선택 시 보여주는 구간 요약 */
export function LocationSummaryCard({ location, onClose }: { location: Location; onClose?: () => void }) {
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:w-80">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-slate-900">{location.name}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{location.address}</p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="-mt-1 -mr-1 rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="닫기">
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <RiskScore score={location.riskScore} level={location.riskLevel} size="lg" />
        <StatusBadge status={location.status} />
      </div>

      <dl className="mt-4 space-y-3 text-[13px]">
        <div>
          <dt className="mb-1 text-xs text-slate-500">주요 원인</dt>
          <dd>
            <ObstacleTags types={location.obstacleTypes} size="sm" />
          </dd>
        </div>
        <div>
          <dt className="mb-1.5 flex justify-between text-xs text-slate-500">
            유효 보행공간 비율
            <span className="tabular font-bold text-slate-900">{Math.round(location.walkableRatio * 100)}%</span>
          </dt>
          <dd>
            <WalkableBar walkableRatio={location.walkableRatio} />
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-xs text-slate-500">차도 우회 필요</dt>
          <dd>
            {location.roadDetourRequired ? (
              <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                <Footprints className="size-3.5" /> 있음
              </span>
            ) : (
              <span className="font-semibold text-slate-600">없음</span>
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-xs text-slate-500">분석 일시</dt>
          <dd className="tabular text-slate-700">{formatDateTime(location.analyzedAt)}</dd>
        </div>
      </dl>

      <ButtonLink href={`/locations/${location.id}`} className="mt-4 w-full flex-row-reverse" icon={<ArrowRight className="size-4" />}>
        상세보기
      </ButtonLink>
    </div>
  );
}
