/**
 * Firebase Storage 업로드.
 *
 *   uploads/{uid}/{시각}_{임의값}.jpg   분석용 이미지 (긴 변 1280px JPEG 로 줄여서 저장)
 *   uploads/{uid}/{시각}_{임의값}.mp4   원본 영상 + 같은 이름의 .jpg 대표 프레임
 *
 * Firestore 에는 내려받기 URL 만 저장한다. AI 서버도 이 URL 로 원본을 가져간다.
 */
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firebaseAuth, firebaseStorage } from "@/lib/firebase";
import { imageFileToDataUrl, videoFileToPosterDataUrl } from "@/lib/media";
import type { StorageService } from "@/services/types";

const dataUrlToBlob = async (dataUrl: string) => (await fetch(dataUrl)).blob();

/** 사용자별 폴더 + 업로드 시각 기반 파일 이름 (확장자 제외) */
function basePath(): string {
  const uid = firebaseAuth().currentUser?.uid;
  if (!uid) throw new Error("로그인이 필요합니다.");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15); // 20261010T132045
  return `uploads/${uid}/${stamp}_${Math.random().toString(36).slice(2, 8)}`;
}

async function put(path: string, data: Blob, contentType: string): Promise<string> {
  const target = ref(firebaseStorage(), path);
  await uploadBytes(target, data, { contentType });
  return getDownloadURL(target);
}

export const firebaseStorageService: StorageService = {
  async uploadAnalysisMedia(file) {
    const base = basePath();
    if (file.type.startsWith("video/")) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const poster = await dataUrlToBlob(await videoFileToPosterDataUrl(file));
      const [videoUrl, imageUrl] = await Promise.all([
        put(`${base}.${ext}`, file, file.type),
        put(`${base}.jpg`, poster, "image/jpeg"),
      ]);
      return { mediaType: "video", imageUrl, videoUrl };
    }
    const image = await dataUrlToBlob(await imageFileToDataUrl(file));
    return { mediaType: "image", imageUrl: await put(`${base}.jpg`, image, "image/jpeg") };
  },
};
