/**
 * Storage 사진 중계 — 브라우저는 Storage 파일을 직접 받아올 수 없어서(버킷 CORS 미설정)
 * 서버가 대신 받아 넘겨준다. 우리 버킷의 내려받기 주소만 허용한다.
 * 쓰는 곳: AI 분석 대기 구간 분석 (Storage 사진 → AI 서버)
 */
const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "";

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("url") ?? "";
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return new Response("잘못된 주소입니다.", { status: 400 });
  }
  const allowed = BUCKET && url.protocol === "https:" && url.host === "firebasestorage.googleapis.com" && url.pathname.startsWith(`/v0/b/${BUCKET}/o/`);
  if (!allowed) return new Response("허용되지 않은 주소입니다.", { status: 403 });

  const res = await fetch(url);
  if (!res.ok) return new Response("사진을 가져오지 못했습니다.", { status: res.status });
  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "private, max-age=300",
    },
  });
}
