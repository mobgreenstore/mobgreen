import type { CommerceImage } from "@/types/commerce";

export interface ManagedImage extends CommerceImage {
  publicId: string;
  bytes?: number;
  format?: string;
  position: number;
  isCover: boolean;
  persisted?: boolean;
}

export interface ImageUploadResponse {
  image: ManagedImage;
}

export interface ImageApiError {
  error: string;
  code?: string;
}
