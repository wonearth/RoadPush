"use client";

import { Database, ScanSearch } from "lucide-react";
import { useState } from "react";
import { locationService } from "@/services";
import { Button, ButtonLink } from "../ui/Button";
import { Card } from "../ui/Card";
import { Spinner } from "../ui/States";

/** 분석된 구간이 하나도 없을 때의 시작 안내 */
export function EmptyDashboard({ onSeeded }: { onSeeded: () => Promise<void> }) {
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seed = async () => {
    setSeeding(true);
    setError(null);
    try {
      await locationService.seedSampleData();
      await onSeeded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "예시 데이터를 불러오지 못했습니다.");
      setSeeding(false);
    }
  };

  return (
    <Card className="mx-auto max-w-2xl px-8 py-12 text-center">
      <p className="text-lg font-bold text-slate-900">아직 분석된 구간이 없습니다</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        도로·보행 영상을 분석해 첫 위험구간을 등록하거나,
        <br />
        신촌·이대 일대 예시 데이터로 관리 흐름을 먼저 둘러볼 수 있습니다.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <ButtonLink href="/analysis" icon={<ScanSearch className="size-4" />}>
          AI 분석 시작
        </ButtonLink>
        <Button variant="secondary" onClick={seed} disabled={seeding} icon={seeding ? <Spinner /> : <Database className="size-4" />}>
          예시 데이터 불러오기
        </Button>
      </div>
      {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}
      <p className="mt-6 text-xs text-slate-400">예시 데이터는 실제 촬영·분석 결과가 아니며 화면에 &lsquo;예시 데이터&rsquo;로 표시됩니다.</p>
    </Card>
  );
}
