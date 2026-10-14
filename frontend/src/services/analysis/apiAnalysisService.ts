/**
 * FastAPI 분석 서비스 클라이언트 (아직 사용하지 않음).
 * 백엔드가 준비되면 services/index.ts 에서 mockAnalysisService 대신 연결한다.
 *
 * 예정 엔드포인트: POST {NEXT_PUBLIC_API_BASE_URL}/api/v1/analyze  (multipart/form-data)
 *   - file: 이미지 또는 영상 (직접 올린 파일)
 *   - imageUrl: file 대신, 이미 Storage 에 저장된 현장 사진 주소 (서버가 직접 내려받는다)
 *   - locationId: (선택) 재분석 대상 구간
 *   응답: AnalysisApiResponse
 */
import type { AnalysisService } from "@/services/types";
import type { AnalysisApiResponse } from "@/types";
import { toAnalysisResult } from "./mockAnalysisService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const apiAnalysisService: AnalysisService = {
  async analyze(input) {
    const form = new FormData();
    if (input.file) {
      form.append("file", input.file);
    } else if (/^https:\/\//.test(input.originalImageUrl)) {
      form.append("imageUrl", input.originalImageUrl);
    } else {
      throw new Error("분석할 파일이 없습니다.");
    }
    if (input.locationId) form.append("locationId", input.locationId);

    const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, { method: "POST", body: form });
    if (!response.ok) {
      // 서버가 보내는 사용자용 안내(예: 보행공간을 찾지 못했습니다)가 있으면 그대로 보여준다
      const detail = await response.json().then((b) => (typeof b?.detail === "string" ? b.detail : ""), () => "");
      throw new Error(detail || `분석 요청 실패 (${response.status})`);
    }
    const data = (await response.json()) as AnalysisApiResponse;

    return toAnalysisResult(data, {
      mediaType: input.mediaType,
      originalImageUrl: input.originalImageUrl,
      originalVideoUrl: input.originalVideoUrl,
      locationId: input.locationId ?? null,
      phase: input.locationId ? "FOLLOW_UP" : "INITIAL",
    });
  },
};
