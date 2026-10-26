/**
 * FastAPI 분석 서비스 클라이언트 (아직 사용하지 않음).
 * 백엔드가 준비되면 services/index.ts 에서 mockAnalysisService 대신 연결한다.
 *
 * 예정 엔드포인트: POST {NEXT_PUBLIC_API_BASE_URL}/api/v1/analyze  (multipart/form-data)
 *   - file: 이미지 또는 영상
 *   - locationId: (선택) 재분석 대상 구간
 *   응답: AnalysisApiResponse
 */
import type { AnalysisService } from "@/services/types";
import type { AnalysisApiResponse } from "@/types";
import { toAnalysisResult } from "./mockAnalysisService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const apiAnalysisService: AnalysisService = {
  async analyze(input) {
    if (!input.file) throw new Error("분석할 파일이 없습니다.");
    const form = new FormData();
    form.append("file", input.file);
    if (input.locationId) form.append("locationId", input.locationId);

    const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, { method: "POST", body: form });
    if (!response.ok) throw new Error(`분석 요청 실패 (${response.status})`);
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
