"use client";

import { useState } from "react";
import { KAKAO_MAP_KEY } from "@/components/map/kakaoLoader";
import { LocationPicker, type PickedLocation } from "@/components/map/LocationPicker";
import { locationService } from "@/services";
import type { AnalysisResult, Location } from "@/types";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { TextField } from "../ui/Field";
import { Spinner } from "../ui/States";

const CAN_PICK_LOCATION = Boolean(KAKAO_MAP_KEY);

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
  const [address, setAddress] = useState("");
  const [picked, setPicked] = useState<PickedLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("구간명을 입력해 주세요.");
    if (CAN_PICK_LOCATION && !picked) return setError("검색하거나 지도를 클릭해 위치를 지정해 주세요.");
    if (!address.trim()) return setError("주소를 입력해 주세요.");
    setSaving(true);
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
      setSaving(false);
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
        <TextField label="구간명" placeholder="예: 신촌 J구간" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        {CAN_PICK_LOCATION && (
          <LocationPicker
            onChange={(value) => {
              setPicked(value);
              if (value.address) setAddress(value.address);
            }}
          />
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
          <Button type="submit" disabled={saving}>
            {saving && <Spinner />}
            등록하고 상세 보기
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
