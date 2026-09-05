import "server-only";

import {
  PRODUCT_VIDEO_UPLOAD_MAX_BYTES,
  PRODUCT_VIDEO_UPLOAD_MIME_TYPES,
} from "@/config/product-video";

export class VideoValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "VideoValidationError";
  }
}

export async function validateProductVideoFile(file: File) {
  if (file.size < 1) {
    throw new VideoValidationError("Choose a non-empty video.", "EMPTY_FILE");
  }
  if (file.size > PRODUCT_VIDEO_UPLOAD_MAX_BYTES) {
    throw new VideoValidationError(
      "The video exceeds the 100 MB limit.",
      "FILE_TOO_LARGE",
      413,
    );
  }
  if (!PRODUCT_VIDEO_UPLOAD_MIME_TYPES.includes(file.type as never)) {
    throw new VideoValidationError(
      "Use an MP4, WebM, or MOV video.",
      "UNSUPPORTED_MEDIA_TYPE",
      415,
    );
  }
  return { buffer: Buffer.from(await file.arrayBuffer()) };
}
