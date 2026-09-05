import type { CommerceImage } from "@/types/commerce";

export interface ManagedImage extends CommerceImage {
  publicId: string;
  bytes?: number;
  format?: string;
  position: number;
  isCover: boolean;
  persisted?: boolean;
}

export interface ManagedVideo {
  id: string;
  publicId: string;
  url: string;
  posterUrl: string | null;
  altText: string;
  width: number;
  height: number;
  durationSeconds: number | null;
  persisted?: boolean;
}

export interface ImageUploadResponse {
  image: ManagedImage;
}

export interface ImageApiError {
  error: string;
  code?: string;
}

export interface VideoUploadResponse {
  video: ManagedVideo;
}
