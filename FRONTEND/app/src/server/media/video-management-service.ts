import "server-only";

import { logger } from "@/server/core/logger";
import { CloudinaryVideoService } from "@/server/media/cloudinary-video-service";
import { PrismaVideoReferenceRepository } from "@/server/media/video-reference-repository";

export class ReferencedVideoError extends Error {
  constructor() {
    super("This video is still attached to a product.");
    this.name = "ReferencedVideoError";
  }
}

export class VideoManagementService {
  constructor(
    private readonly references = new PrismaVideoReferenceRepository(),
    private readonly storage = new CloudinaryVideoService(),
  ) {}

  async removeUnreferenced(publicId: string) {
    if (await this.references.isReferenced(publicId)) {
      throw new ReferencedVideoError();
    }
    await this.storage.remove(publicId);
  }

  async cleanupAfterReplacement(publicId: string) {
    try {
      await this.removeUnreferenced(publicId);
    } catch (error) {
      logger.warn("cloudinary.video.deferred_cleanup_required", {
        error,
        publicId,
      });
    }
  }
}
