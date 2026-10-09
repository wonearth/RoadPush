"use client";

import { MapPinned } from "lucide-react";
import { useMemo, useState } from "react";
import { KAKAO_MAP_KEY } from "@/components/map/kakaoLoader";
import { LocationPicker, type PickedLocation } from "@/components/map/LocationPicker";
import { RiskBadge, StatusBadge } from "@/components/risk/RiskBadge";
import { useAuth } from "@/hooks/useAuth";
import { useAsync } from "@/hooks/useAsync";
import { suggestLocationName } from "@/lib/format";
import { distanceMeters } from "@/lib/geo";
import { locationService } from "@/services";
import type { AnalysisResult, Location } from "@/types";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { TextField } from "../ui/Field";
import { Spinner } from "../ui/States";

const CAN_PICK_LOCATION = Boolean(KAKAO_MAP_KEY);
/** 이 거리 안에 기존 구간이 있으면 같은 곳일 수 있다고 보고 추가를 제안한다 */
const NEARBY_METERS = 30;

export function RegisterLocationDialog({
  open,
  onClose,
  analysis,
  onRegistered,
}: {
  open: boolean;
  onClose: () => void;
  analysis: AnalysisResult;
  onRegistered: (location: Location) => void;
}) {
  const [name, setName] = useState("");
  // 사용자가 직접 고치지 않았다면 위치가 바뀔 때마다 구간명을 다시 제안한다.
  const [suggested, setSuggested] = useState("");
  const [address, setAddress] = useState("");
  const [picked, setPicked] = useState<PickedLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const { user } = useAuth();
  const { data: existing = [] } = useAsync(() => locationService.list(), "register-nearby");

  // 지정한 위치 30m 안의 기존 구간 (종료된 구간은 뺀다), 가까운 순
  const nearby = useMemo(
    () =>
      picked
        ? existing
            .filter((l) => l.status !== "CLOSED")
            .map((l) => ({ location: l, meters: Math.round(distanceMeters(picked, l)) }))
            .filter((n) => n.meters <= NEARBY_METERS)
            .sort((a, b) => a.meters - b.meters)
            .slice(0, 3)
        : [],
    [existing, picked],
  );

  const addToExisting = async (location: Location) => {
    setSaving(location.id);
    setError(null);
    try {
      onRegistered(await locationService.addRepeatAnalysis(location.id, analysis, user?.name ?? "데모 관리자"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "추가에 실패했습니다.");
      setSaving(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("구간명을 입력해 주세요.");
    if (CAN_PICK_LOCATION && !picked) return setError("검색하거나 지도를 클릭해 위치를 지정해 주세요.");
    if (!address.trim()) return setError("주소를 입력해 주세요.");
    setSaving("new");
    setError(null);
    try {
      const location = await locationService.createFromAnalysis(
        {
          name,
          address,
          area: picked?.area || undefined,
          latitude: picked?.latitude,
          longitude: picked?.longitude,
        },
        analysis,
      );
      onRegistered(location);
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
      setSaving(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size={CAN_PICK_LOCATION ? "lg" : "md"}
      title="위험구간으로 등록"
      description="분석 결과를 관리 대상 구간으로 등록하면 위험지도와 대시보드에 표시되고 현장조치를 관리할 수 있습니다."
    >
      <form onSubmit={submit} className="space-y-4">
        <TextField
          label="구간명"
          placeholder={CAN_PICK_LOCATION ? "위치를 지정하면 자동으로 제안돼요" : "예: ○○동 A구간"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          hint={name && name === suggested ? "위치 기준으로 자동 제안된 이름이에요. 고쳐 쓸 수 있어요." : undefined}
        />
        {CAN_PICK_LOCATION && (
          <LocationPicker
            onChange={(value) => {
              setPicked(value);
              if (value.address) setAddress(value.address);
              const next = suggestLocationName(value);
              if (next && (!name.trim() || name === suggested)) setName(next);
              setSuggested(next);
            }}
          />
        )}
        {nearby.length > 0 && (
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
              <MapPinned className="size-4" /> {NEARBY_METERS}m 안에 이미 등록된 구간이 있어요
            </p>
            <p className="mt-0.5 text-[13px] text-amber-800">같은 곳이라면 새로 만들지 말고 기존 구간에 이번 분석을 추가해 주세요.</p>
            <ul className="mt-3 space-y-1.5">
              {nearby.map(({ location: l, meters }) => (
                <li key={l.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                      {l.name} <RiskBadge level={l.riskLevel} /> <StatusBadge status={l.status} />
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {meters}m 거리 · {l.address}
                    </span>
                  </span>
                  <Button type="button" size="sm" variant="secondary" disabled={!!saving} onClick={() => addToExisting(l)}>
                    {saving === l.id && <Spinner />}이 구간에 추가
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <TextField
          label={CAN_PICK_LOCATION ? "주소 (자동 입력 · 수정 가능)" : "위치"}
          placeholder="예: 서울 서대문구 연세로 OO빌딩 앞 보도"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          hint={
            CAN_PICK_LOCATION
              ? "보도 방향 등 상세 위치를 덧붙여도 됩니다. (예: ○○빌딩 앞 남측 보도)"
              : "지도 API 연결 시 주소 검색·지도에서 위치를 지정할 수 있습니다. (현재는 신촌·이대 일대 임의 좌표에 표시)"
          }
        />
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" variant={nearby.length ? "secondary" : "primary"} disabled={!!saving}>
            {saving === "new" && <Spinner />}
            {nearby.length ? "다른 곳이에요, 새 구간으로 등록" : "등록하고 상세 보기"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
