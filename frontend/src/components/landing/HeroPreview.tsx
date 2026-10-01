import { Footprints } from "lucide-react";
import { MOCK_SAMPLE_OVERLAY, MOCK_SAMPLE_SCENE_URL } from "@/mocks/mockOverlay";
import { MediaFrame } from "../media/MediaFrame";
import { ObstacleTags } from "../risk/ObstacleTags";
import { RiskBadge, StatusBadge } from "../risk/RiskBadge";
import { WalkableBar } from "../risk/RiskBar";

/** Landing 히어로의 제품 미리보기 (개발용 예시 데이터) */
export function HeroPreview() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)]">
      <MediaFrame
        variant="result"
        src={MOCK_SAMPLE_SCENE_URL}
        overlay={MOCK_SAMPLE_OVERLAY}
        walkableRatio={0.31}
        roadDetourRequired
        label="AI 보행공간 분석"
      />
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">신촌 A구간</p>
          <p className="text-xs text-slate-500">연세로 신촌역 3번 출구 앞 보도 · 예시</p>
        </div>
        <StatusBadge status="REVIEW_REQUIRED" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-slate-100 pt-3">
        <div>
          <p className="text-[11px] text-slate-500">단절 위험도</p>
          <p className="mt-0.5 flex items-center gap-1.5">
            <span className="tabular text-2xl font-bold text-red-600">82</span>
            <RiskBadge level="DANGER" />
          </p>
        </div>
        <div className="col-span-2">
          <p className="mb-1.5 text-[11px] text-slate-500">유효 보행공간</p>
          <WalkableBar walkableRatio={0.31} showLabels />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <ObstacleTags types={["ILLEGAL_PARKING", "CONSTRUCTION"]} size="sm" />
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
          <Footprints className="size-3.5" /> 차도 우회 필요
        </span>
      </div>
    </div>
  );
}
