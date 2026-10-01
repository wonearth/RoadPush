const MAX_EDGE = 1280;

function drawToDataUrl(source: CanvasImageSource, width: number, height: number): string {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

/** 이미지를 축소된 dataURL 로 변환한다. */
export function imageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(drawToDataUrl(img, img.naturalWidth, img.naturalHeight));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => reject(new Error("이미지를 읽을 수 없습니다."));
    img.src = url;
  });
}

/** 영상의 대표 프레임(앞부분)을 dataURL 로 추출한다. */
export function videoFileToPosterDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.5, video.duration / 2 || 0);
    };
    video.onseeked = () => {
      resolve(drawToDataUrl(video, video.videoWidth, video.videoHeight));
    };
    video.onerror = () => reject(new Error("영상을 읽을 수 없습니다."));
    video.src = url;
  });
}
