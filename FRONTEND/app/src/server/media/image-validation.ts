import "server-only";

import sharp, { type Metadata } from "sharp";
import {
  IMAGE_UPLOAD_MAX_BYTES,
  IMAGE_UPLOAD_MAX_DIMENSION,
  IMAGE_UPLOAD_MAX_PIXELS,
  IMAGE_UPLOAD_MIME_TYPES,
} from "@/config/images";

const allowedFormats = new Set(["jpeg", "png", "webp", "avif"]);

export class ImageValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "ImageValidationError";
  }
}

export async function validateImageFile(file: File) {
  if (file.size < 1) {
    throw new ImageValidationError("Choose a non-empty image.", "EMPTY_FILE");
  }
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    throw new ImageValidationError(
      "The image exceeds the 50 MB limit.",
      "FILE_TOO_LARGE",
      413,
    );
  }
  if (!IMAGE_UPLOAD_MIME_TYPES.includes(file.type as never)) {
    throw new ImageValidationError(
      "Use a JPEG, PNG, WebP, or AVIF image.",
      "UNSUPPORTED_MEDIA_TYPE",
      415,
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let metadata: Metadata;
  try {
    metadata = await sharp(buffer, {
      failOn: "error",
      limitInputPixels: IMAGE_UPLOAD_MAX_PIXELS,
    }).metadata();
  } catch {
    throw new ImageValidationError(
      "The selected file is not a valid supported image.",
      "INVALID_IMAGE",
    );
  }

  if (
    !metadata.format ||
    !allowedFormats.has(metadata.format) ||
    !metadata.width ||
    !metadata.height
  ) {
    throw new ImageValidationError(
      "The selected file is not a valid supported image.",
      "INVALID_IMAGE",
    );
  }
  if (
    metadata.width > IMAGE_UPLOAD_MAX_DIMENSION ||
    metadata.height > IMAGE_UPLOAD_MAX_DIMENSION
  ) {
    throw new ImageValidationError(
      "Image width and height must each be 12,000 pixels or less.",
      "DIMENSIONS_TOO_LARGE",
    );
  }

  return { buffer, metadata };
}
