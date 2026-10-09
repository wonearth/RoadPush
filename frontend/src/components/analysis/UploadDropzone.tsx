"use client";

import { Camera, FileImage, FileVideo, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

const ACCEPT = "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm";
const MAX_SIZE_MB = 200;

export function UploadDropzone({
  onFile,
  compact = false,
  disabled = false,
  camera = false,
}: {
  onFile: (file: File) => void;
  compact?: boolean;
  disabled?: boolean;
  /** 휴대폰에서 바로 카메라를 여는 버튼을 함께 보여준다 */
  camera?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setError("이미지 또는 영상 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`${MAX_SIZE_MB}MB 이하 파일만 업로드할 수 있습니다.`);
      return;
    }
    setError(null);
    onFile(file);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) handle(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-colors",
          compact ? "px-4 py-6" : "px-6 py-12",
          dragging ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-white text-brand-600">
          <UploadCloud className="size-5" />
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-800">
          도로·보행 이미지 또는 영상을 <span className="hidden sm:inline">끌어다 놓거나 </span>
          <span className="text-brand-600">파일 선택</span>
        </p>
        {!compact && (
          <p className="mt-1 text-xs text-slate-500">CCTV · 블랙박스 · 현장점검 촬영본 / 최대 {MAX_SIZE_MB}MB</p>
        )}
        <div className="mt-3 flex items-center gap-3 text-[11px] font-medium text-slate-500">
          <span className="inline-flex items-center gap-1">
            <FileImage className="size-3.5" /> JPG · PNG · WEBP
          </span>
          <span className="inline-flex items-center gap-1">
            <FileVideo className="size-3.5" /> MP4 · MOV · WEBM
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            handle(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {camera && (
        <>
          <button
            type="button"
            disabled={disabled}
            onClick={() => cameraRef.current?.click()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-[15px] font-semibold text-white disabled:opacity-60 sm:hidden"
          >
            <Camera className="size-4" /> 카메라로 촬영
          </button>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              handle(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </>
      )}
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
