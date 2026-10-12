"use client";

import { Camera, ImagePlus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LocationPicker, type PickedLocation } from "@/components/map/LocationPicker";
import { readPhotoMeta, type PhotoMeta } from "@/lib/exif";
import { formatDateTime, suggestLocationName } from "@/lib/format";
import { distanceMeters } from "@/lib/geo";
import { imageFileToDataUrl } from "@/lib/media";
import { locationService, storageService } from "@/services";
import type { Location, LocationPhoto } from "@/types";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { TextField } from "../ui/Field";
import { Spinner } from "../ui/States";

const MAX_PHOTOS = 10;
/** 사진들의 촬영 위치가 이보다 멀리 떨어져 있으면 다른 지점이 섞였을 수 있다고 알린다 */
const SPREAD_WARN_METERS = 50;

interface Picked {
  file: File;
  preview: string;
  meta: PhotoMeta;
}

/**
 * 현장 사진 등록 — 한 지점에서 찍은 사진 여러 장을 올려 'AI 분석 대기' 구간으로 등록한다.
 * 사진 속 GPS 로 위치를 자동 지정하고, 없으면 지도에서 고른다.
 */
export function RegisterPhotosDialog({ onClose, onRegistered }: { onClose: () => void; onRegistered: (location: Location) => void }) {
  const [photos, setPhotos] = useState<Picked[]>([]);
  const [picked, setPicked] = useState<PickedLocation | null>(null);
  const [name, setName] = useState("");
  const [suggested, setSuggested] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // 미리보기 URL 은 창을 닫을 때 한꺼번에 정리한다
  const previews = useRef<string[]>([]);
  useEffect(() => () => previews.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const withGps = photos.filter((p) => p.meta.latitude && p.meta.longitude);
  const gpsCenter = useMemo(
    () =>
      withGps.length
        ? {
            latitude: withGps.reduce((s, p) => s + p.meta.latitude!, 0) / withGps.length,
            longitude: withGps.reduce((s, p) => s + p.meta.longitude!, 0) / withGps.length,
          }
        : null,
    // 사진이 추가·삭제될 때만 다시 계산한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [photos],
  );
  const spread = gpsCenter
    ? Math.max(...withGps.map((p) => distanceMeters(gpsCenter, { latitude: p.meta.latitude!, longitude: p.meta.longitude! })))
    : 0;

  const addFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setError(null);
    const files = Array.from(list);
    if (files.some((f) => /heic|heif/i.test(f.type) || /\.hei[cf]$/i.test(f.name))) {
      setError("HEIC 사진은 올릴 수 없습니다. JPG로 변환해 올려 주세요. (아이폰: 설정 › 카메라 › 포맷 › 높은 호환성)");
      return;
    }
    const images = files.filter((f) => f.type.startsWith("image/"));
    const next = await Promise.all(images.map(async (file) => ({ file, preview: URL.createObjectURL(file), meta: await readPhotoMeta(file) })));
    previews.current.push(...next.map((p) => p.preview));
    setPhotos((prev) => [...prev, ...next].slice(0, MAX_PHOTOS));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photos.length) return setError("사진을 한 장 이상 올려 주세요.");
    if (!picked) return setError("사진에 위치 정보가 없습니다. 지도에서 위치를 지정해 주세요.");
    if (!name.trim()) return setError("구간명을 입력해 주세요.");
    setError(null);
    try {
      const uploaded: LocationPhoto[] = [];
      for (const [i, p] of photos.entries()) {
        setSaving(`사진 올리는 중 (${i + 1}/${photos.length})`);
        const blob = await (await fetch(await imageFileToDataUrl(p.file))).blob();
        const label = p.file.name.replace(/\.[^.]+$/, "");
        uploaded.push({ url: await storageService.uploadPhoto(blob, label), takenAt: p.meta.takenAt ?? new Date().toISOString(), label });
      }
      setSaving("구간 등록 중");
      const location = await locationService.createPendingLocation({
        name,
        address: picked.address,
        area: picked.area,
        latitude: picked.latitude,
        longitude: picked.longitude,
        photos: uploaded,
      });
      onRegistered(location);
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
      setSaving(null);
    }
  };

  return (
    <Dialog open onClose={() => !saving && onClose()} size="lg" title="현장 사진 등록" description="한 지점에서 찍은 사진을 올리면 'AI 분석 대기' 구간으로 등록됩니다.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {photos.map((p, i) => (
              <div key={p.preview} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.preview} alt={p.file.name} className="aspect-[3/4] w-full rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                  disabled={!!saving}
                  className="absolute top-1 right-1 rounded-full bg-slate-900/60 p-0.5 text-white"
                  aria-label={`${p.file.name} 빼기`}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={!!saving}
                className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-xs font-medium text-slate-500 hover:border-brand-400 hover:text-brand-600"
              >
                <ImagePlus className="size-5" />
                사진 선택
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={!!saving || photos.length >= MAX_PHOTOS}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-[15px] font-semibold text-white disabled:opacity-60 sm:hidden"
          >
            <Camera className="size-4" /> 카메라로 촬영
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => (void addFiles(e.target.files), (e.target.value = ""))} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => (void addFiles(e.target.files), (e.target.value = ""))} />
          <p className="mt-2 text-xs text-slate-500">
            {photos.length ? `${photos.length}장 · ` : ""}최대 {MAX_PHOTOS}장
            {withGps.length > 0 && ` · 위치 정보 있는 사진 ${withGps.length}장`}
            {photos[0]?.meta.takenAt && ` · ${formatDateTime(photos[0].meta.takenAt)} 촬영`}
          </p>
          {spread > SPREAD_WARN_METERS && (
            <p className="mt-1 text-xs font-medium text-amber-700">
              사진 촬영 위치가 최대 {Math.round(spread)}m 떨어져 있습니다. 다른 지점 사진이 섞였는지 확인해 주세요.
            </p>
          )}
        </div>

        <LocationPicker
          initial={gpsCenter}
          onChange={(value) => {
            setPicked(value);
            const next = suggestLocationName(value);
            if (next && (!name.trim() || name === suggested)) setName(next);
            setSuggested(next);
          }}
        />
        <TextField
          label="구간명"
          placeholder="위치 지정 시 자동 입력"
          value={name}
          onChange={(e) => setName(e.target.value)}
          hint={name && name === suggested ? "위치 기준 자동 입력 · 수정 가능" : undefined}
        />

        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        <div className="flex items-center justify-end gap-2 pt-1">
          {saving && <span className="mr-auto text-xs text-slate-500">{saving}</span>}
          <Button type="button" variant="secondary" onClick={onClose} disabled={!!saving}>
            취소
          </Button>
          <Button type="submit" disabled={!!saving || !photos.length} icon={saving ? <Spinner /> : undefined}>
            등록
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
