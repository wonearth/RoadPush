/**
 * JPEG 사진의 EXIF 에서 촬영 위치(GPS)와 촬영 시각만 읽는다 (외부 라이브러리 없이).
 * 휴대폰 사진은 대부분 이 정보를 갖고 있지만, 메신저로 받은 사진은 지워져 있을 수 있다.
 */
export interface PhotoMeta {
  latitude?: number;
  longitude?: number;
  /** ISO 8601 (촬영 기기 현지 시각을 그대로 KST 로 본다) */
  takenAt?: string;
}

export async function readPhotoMeta(file: File): Promise<PhotoMeta> {
  // EXIF 는 파일 앞부분(APP1)에 있으므로 앞 128KB 만 읽는다
  const view = new DataView(await file.slice(0, 128 * 1024).arrayBuffer());
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return {};
  let offset = 2;
  while (offset + 4 < view.byteLength) {
    const marker = view.getUint16(offset);
    const size = view.getUint16(offset + 2);
    if (marker === 0xffe1 && view.getUint32(offset + 4) === 0x45786966) return parseExif(view, offset + 10);
    if ((marker & 0xff00) !== 0xff00) break;
    offset += 2 + size;
  }
  return {};
}

function parseExif(view: DataView, tiff: number): PhotoMeta {
  const little = view.getUint16(tiff) === 0x4949;
  const u16 = (o: number) => view.getUint16(o, little);
  const u32 = (o: number) => view.getUint32(o, little);
  const rational = (o: number) => u32(o) / (u32(o + 4) || 1);
  const ascii = (o: number, n: number) => String.fromCharCode(...Array.from({ length: n }, (_, i) => view.getUint8(o + i))).replace(/\0+$/, "");

  /** IFD 의 태그 → 값 위치·개수 */
  const readIfd = (start: number) => {
    const tags = new Map<number, { type: number; count: number; at: number }>();
    const n = u16(start);
    for (let i = 0; i < n; i++) {
      const e = start + 2 + i * 12;
      const type = u16(e + 2);
      const count = u32(e + 4);
      const bytes = count * ({ 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 }[type] ?? 1);
      tags.set(u16(e), { type, count, at: bytes > 4 ? tiff + u32(e + 8) : e + 8 });
    }
    return tags;
  };

  try {
    const ifd0 = readIfd(tiff + u32(tiff + 4));
    const meta: PhotoMeta = {};

    const exifPtr = ifd0.get(0x8769);
    const exif = exifPtr ? readIfd(tiff + u32(exifPtr.at)) : null;
    const dt = exif?.get(0x9003) ?? ifd0.get(0x0132); // DateTimeOriginal, 없으면 DateTime
    if (dt) {
      const m = ascii(dt.at, dt.count).match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
      if (m) meta.takenAt = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+09:00`;
    }

    const gpsPtr = ifd0.get(0x8825);
    if (gpsPtr) {
      const gps = readIfd(tiff + u32(gpsPtr.at));
      const coord = (tag: number, refTag: number) => {
        const v = gps.get(tag);
        const ref = gps.get(refTag);
        if (!v || !ref) return undefined;
        const deg = rational(v.at) + rational(v.at + 8) / 60 + rational(v.at + 16) / 3600;
        return /[SW]/.test(ascii(ref.at, 1)) ? -deg : deg;
      };
      const lat = coord(2, 1);
      const lng = coord(4, 3);
      if (lat && lng) Object.assign(meta, { latitude: lat, longitude: lng });
    }
    return meta;
  } catch {
    return {};
  }
}
