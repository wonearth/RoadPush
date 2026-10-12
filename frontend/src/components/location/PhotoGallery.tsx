"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/format";
import type { LocationPhoto } from "@/types";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Dialog } from "../ui/Dialog";

/** 현장 사진 모음 — 누르면 크게 본다 */
export function PhotoGallery({ photos, title = "현장 사진" }: { photos: LocationPhoto[]; title?: string }) {
  const [open, setOpen] = useState<LocationPhoto | null>(null);
  return (
    <Card>
      <CardHeader title={`${title} ${photos.length}장`} />
      <CardBody className="grid grid-cols-2 gap-3 pt-4 md:grid-cols-3">
        {photos.map((p) => (
          <figure key={p.url}>
            <button type="button" onClick={() => setOpen(p)} className="block w-full overflow-hidden rounded-xl bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`${title} ${p.label ?? ""}`} loading="lazy" className="aspect-[3/4] w-full object-cover transition-transform hover:scale-[1.02]" />
            </button>
            <figcaption className="tabular mt-1.5 flex justify-between text-xs text-slate-500">
              <span>{formatDateTime(p.takenAt)}</span>
              {p.label && <span className="text-slate-400">{p.label}</span>}
            </figcaption>
          </figure>
        ))}
      </CardBody>
      <Dialog open={!!open} onClose={() => setOpen(null)} size="lg" title={open ? `${formatDateTime(open.takenAt)} 촬영` : ""}>
        {open && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={open.url} alt={`${title} 크게 보기`} className="max-h-[75vh] w-full rounded-lg object-contain" />
        )}
      </Dialog>
    </Card>
  );
}
