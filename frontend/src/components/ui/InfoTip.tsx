"use client";

import { CircleHelp } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

const WIDTH = 256;
const GUTTER = 12;

/** ❓ 아이콘 — 마우스를 올리거나 눌렀을 때 짧은 설명을 보여준다. 화면 밖으로 넘치지 않게 위치를 맞춘다. */
export function InfoTip({ text, label = "설명 보기" }: { text: string; label?: string }) {
  const [pos, setPos] = useState<CSSProperties | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  const open = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(WIDTH, window.innerWidth - GUTTER * 2);
    const left = Math.min(Math.max(r.right - width, GUTTER), window.innerWidth - GUTTER - width);
    setPos({ top: r.bottom + 8, left, width });
  };

  useEffect(() => {
    if (!pos) return;
    const close = (e: Event) => (e.type === "scroll" || !ref.current?.contains(e.target as Node)) && setPos(null);
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [pos]);

  return (
    <span ref={ref} className="inline-flex" onMouseEnter={open} onMouseLeave={() => setPos(null)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={!!pos}
        onClick={open}
        className="rounded-full text-slate-400 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-brand-500"
      >
        <CircleHelp className="size-[18px]" />
      </button>
      {pos && (
        <span
          role="tooltip"
          style={pos}
          className="fixed z-50 rounded-xl bg-slate-900 px-3.5 py-2.5 text-[13.5px] leading-relaxed font-normal text-white shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
