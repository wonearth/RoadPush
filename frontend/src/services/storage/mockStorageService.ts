/**
 * ⚠️ 개발용 MOCK 업로드.
 * 파일을 서버에 올리지 않고 브라우저 안에서 미리보기 URL 만 만든다.
 * TODO(firebase): Firebase Storage 업로드로 교체
 *   uploadBytes(ref(storage, `uploads/${uid}/${fileName}`), file) → getDownloadURL
 */
import { imageFileToDataUrl, videoFileToPosterDataUrl } from "@/lib/media";
import type { StorageService } from "@/services/types";

export const mockStorageService: StorageService = {
  async uploadAnalysisMedia(file) {
    if (file.type.startsWith("video/")) {
      return {
        mediaType: "video",
        imageUrl: await videoFileToPosterDataUrl(file),
        // blob URL 은 현재 세션에서만 유효하다 (mock 한정)
        videoUrl: URL.createObjectURL(file),
      };
    }
    return { mediaType: "image", imageUrl: await imageFileToDataUrl(file) };
  },
};
