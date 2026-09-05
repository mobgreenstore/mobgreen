import "server-only";

import { randomUUID } from "node:crypto";
import type { UploadApiResponse } from "cloudinary";
import { logger } from "@/server/core/logger";
import { getCloudinaryClient } from "@/server/media/cloudinary-client";
import type { ManagedVideo } from "@/types/media";

export class CloudinaryVideoError extends Error {
  constructor(message = "The video service could not complete the request.") {
    super(message);
    this.name = "CloudinaryVideoError";
  }
}

function uploadBuffer(buffer: Buffer, publicId: string) {
  const client = getCloudinaryClient();
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        resource_type: "video",
        folder: "mob-greens/products/videos",
        public_id: publicId,
        unique_filename: false,
        overwrite: false,
        allowed_formats: ["mp4", "webm", "mov"],
        use_filename: false,
      },
      (error, result) => {
        if (error || !result) reject(error ?? new CloudinaryVideoError());
        else resolve(result);
      },
    );
    stream.end(buffer);
  });
}

function posterUrl(publicId: string) {
  return getCloudinaryClient().url(publicId, {
    resource_type: "video",
    format: "jpg",
    transformation: [{ start_offset: 0 }],
  });
}

export class CloudinaryVideoService {
  async upload(input: {
    buffer: Buffer;
    altText: string;
  }): Promise<ManagedVideo> {
    const publicId = randomUUID();
    try {
      const result = await uploadBuffer(input.buffer, publicId);
      return {
        id: result.asset_id,
        publicId: result.public_id,
        url: result.secure_url,
        posterUrl: posterUrl(result.public_id),
        altText: input.altText,
        width: result.width,
        height: result.height,
        durationSeconds: result.duration ? Math.ceil(result.duration) : null,
        persisted: false,
      };
    } catch (error) {
      logger.error("cloudinary.video.upload_failed", { error });
      throw new CloudinaryVideoError();
    }
  }

  async remove(publicId: string) {
    try {
      const result = await getCloudinaryClient().uploader.destroy(publicId, {
        resource_type: "video",
        invalidate: true,
      });
      if (result.result !== "ok" && result.result !== "not found") {
        throw new CloudinaryVideoError();
      }
    } catch (error) {
      logger.error("cloudinary.video.remove_failed", { error, publicId });
      throw new CloudinaryVideoError();
    }
  }
}
