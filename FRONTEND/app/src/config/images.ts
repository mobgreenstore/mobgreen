export const IMAGE_UPLOAD_MAX_BYTES = 50 * 1024 * 1024;
export const IMAGE_UPLOAD_MAX_LABEL = "50 MB";
export const IMAGE_UPLOAD_MAX_DIMENSION = 12_000;
export const IMAGE_UPLOAD_MAX_PIXELS = 40_000_000;
export const IMAGE_UPLOAD_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
export const IMAGE_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;
export const IMAGE_UPLOAD_SCOPES = ["category", "product"] as const;

export type ImageUploadScope = (typeof IMAGE_UPLOAD_SCOPES)[number];
