import "server-only";

import { randomUUID } from "node:crypto";
import type { UploadApiResponse } from "cloudinary";
import type { ImageUploadScope } from "@/config/images";
import { logger } from "@/server/core/logger";
import { getCloudinaryClient } from "@/server/media/cloudinary-client";
import type { ManagedImage } from "@/types/media";

export class CloudinaryImageError extends Error {
  constructor(message = "The image service could not complete the request.") {
    super(message);
    this.name = "CloudinaryImageError";
  }
}

function folderFor(scope: ImageUploadScope) {
  return `mob-greens/${scope === "category" ? "categories" : "products"}`;
}

function uploadBuffer(
  buffer: Buffer,
  options: { folder: string; publicId: string },
) {
  const client = getCloudinaryClient();
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        resource_type: "image",
        folder: options.folder,
        public_id: options.publicId,
        unique_filename: false,
        overwrite: false,
        allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
        use_filename: false,
      },
      (error, result) => {
        if (error || !result) reject(error ?? new CloudinaryImageError());
        else resolve(result);
      },
    );
    stream.end(buffer);
  });
}

export class CloudinaryImageService {
  async upload(input: {
    buffer: Buffer;
    scope: ImageUploadScope;
    altText: string;
    position?: number;
    isCover?: boolean;
  }): Promise<ManagedImage> {
    const folder = folderFor(input.scope);
    const publicId = randomUUID();
    try {
      const result = await uploadBuffer(input.buffer, { folder, publicId });
      return {
        id: result.asset_id,
        publicId: result.public_id,
        url: result.secure_url,
        altText: input.altText,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        format: result.format,
        position: input.position ?? 0,
        isCover: input.isCover ?? true,
        persisted: false,
      };
    } catch (error) {
      logger.error("cloudinary.image.upload_failed", {
        error,
        scope: input.scope,
      });
      throw new CloudinaryImageError();
    }
  }

  async remove(publicId: string) {
    try {
      const result = await getCloudinaryClient().uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true,
      });
      if (result.result !== "ok" && result.result !== "not found") {
        throw new CloudinaryImageError();
      }
    } catch (error) {
      logger.error("cloudinary.image.remove_failed", { error, publicId });
      throw new CloudinaryImageError();
    }
  }
}
