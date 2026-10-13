"use client";

/**
 * 현장 사진 일괄 등록 (개발 서버 전용 — 배포 사이트에서는 404).
 *
 * public/_import/ 에 JPEG 로 변환한 사진과 manifest.json(지점별 사진·좌표)을 두고,
 * 로그인한 계정으로 Storage 업로드 + 'AI 분석 대기' 구간 생성을 한 번에 한다.
 * 이미 등록한 지점(importKey 가 같은 구간)은 건너뛰고, 기록표에서 이름이 바뀌었으면 이름만 맞춘다.
 */
import { notFound } from "next/navigation";
import { useState } from "react";
import { reverseGeocode } from "@/components/map/kakaoGeo";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton, Spinner } from "@/components/ui/States";
import { useAsync } from "@/hooks/useAsync";
import { formatDateTime } from "@/lib/format";
import { locationService, storageService } from "@/services";

interface ManifestSpot {
  key: string;
  batch: string;
  name: string;
  latitude: number;
  longitude: number;
  photos: { file: string; imageNo: number; takenAt: string }[];
}

type Progress = "running" | "done" | { error: string };

async function loadManifest(): Promise<ManifestSpot[]> {
  const res = await fetch("/_import/manifest.json", { cache: "no-store" });
  if (!res.ok) throw new Error("public/_import/manifest.json 이 없습니다.");
  return res.json();
}

async function registerSpot(spot: ManifestSpot) {
  const photos = [];
  for (const p of spot.photos) {
    const blob = await (await fetch(`/_import/${p.file}`)).blob();
    const label = `IMG_${p.imageNo}`;
    photos.push({ url: await storageService.uploadPhoto(blob, label), takenAt: p.takenAt, label });
  }
  const geo = await reverseGeocode(spot.latitude, spot.longitude).catch(() => null);
  await locationService.createPendingLocation({
    name: spot.name,
    address: geo?.address ?? "",
    area: geo?.area ?? "",
    latitude: spot.latitude,
    longitude: spot.longitude,
    photos,
    importKey: spot.key,
  });
}

export default function ImportPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const { data, loading, error, reload } = useAsync(() => Promise.all([loadManifest(), locationService.list()]), "dev-import");
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [running, setRunning] = useState(false);

  if (loading && !data) return <Skeleton className="m-8 h-64 rounded-2xl" />;
  if (error && !data) return <p className="m-8 text-sm text-red-600">{error.message}</p>;
  const [spots = [], existing = []] = data ?? [];
  const imported = new Set(existing.map((l) => l.importKey).filter(Boolean));
  const todo = spots.filter((s) => !imported.has(s.key));
  // 이미 등록했지만 기록표에서 이름이 고쳐진 지점
  const renames = existing.flatMap((l) => {
    const spot = spots.find((s) => s.key === l.importKey);
    return spot && spot.name !== l.name ? [{ id: l.id, key: spot.key, name: spot.name, current: l.name }] : [];
  });

  const run = async () => {
    setRunning(true);
    for (const r of renames) {
      setProgress((p) => ({ ...p, [r.key]: "running" }));
      await locationService.renameLocation(r.id, r.name);
      setProgress((p) => ({ ...p, [r.key]: "done" }));
    }
    // 하나씩 순서대로 — 관리번호가 등록 순서대로 붙는다
    for (const spot of todo) {
      setProgress((p) => ({ ...p, [spot.key]: "running" }));
      try {
        await registerSpot(spot);
        setProgress((p) => ({ ...p, [spot.key]: "done" }));
      } catch (e) {
        setProgress((p) => ({ ...p, [spot.key]: { error: e instanceof Error ? e.message : String(e) } }));
      }
    }
    setRunning(false);
    await reload();
  };

  return (
    <div className="space-y-5 px-4 pt-5 pb-10 sm:px-8">
      <Card>
        <CardHeader
          title={`현장 사진 일괄 등록 (${spots.length}곳, ${spots.reduce((n, s) => n + s.photos.length, 0)}장)`}
          description="촬영 폴더의 사진을 지점별로 묶어 'AI 분석 대기' 구간으로 등록합니다."
          action={
            <Button onClick={run} disabled={running || !(todo.length || renames.length)} icon={running ? <Spinner /> : undefined}>
              {todo.length || renames.length
                ? [todo.length && `${todo.length}곳 등록`, renames.length && `이름 ${renames.length}곳 수정`].filter(Boolean).join(" · ")
                : "모두 등록됨"}
            </Button>
          }
        />
        <CardBody className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="py-2 pl-3">키</th>
                  <th className="py-2">지점</th>
                  <th className="py-2">사진</th>
                  <th className="py-2">좌표</th>
                  <th className="py-2 pr-3">상태</th>
                </tr>
              </thead>
              <tbody>
                {spots.map((s) => {
                  const pr = progress[s.key];
                  const rename = renames.find((r) => r.key === s.key);
                  const state = rename
                    ? pr === "done"
                      ? "이름 수정됨"
                      : `이름 수정 예정 (현재: ${rename.current})`
                    : imported.has(s.key)
                      ? "등록됨"
                      : pr === "running"
                        ? "올리는 중…"
                        : pr === "done"
                          ? "완료"
                          : pr
                            ? `오류: ${pr.error}`
                            : "대기";
                  return (
                    <tr key={s.key} className="border-b border-slate-100 align-top">
                      <td className="tabular py-2 pl-3 text-slate-500">{s.key}</td>
                      <td className="py-2 font-semibold text-slate-900">
                        {s.name}
                        <p className="tabular text-xs font-normal text-slate-400">{formatDateTime(s.photos[0].takenAt)}</p>
                      </td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          {s.photos.map((p) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={p.file}
                              src={`/_import/${p.file}`}
                              alt={p.file}
                              title={p.file}
                              className="h-14 w-10 rounded object-cover"
                            />
                          ))}
                        </div>
                      </td>
                      <td className="tabular py-2 text-xs text-slate-500">
                        {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}
                      </td>
                      <td className="py-2 pr-3 text-xs">{state}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
