import "server-only";

import { logger } from "@/server/core/logger";
import { CloudinaryImageService } from "@/server/media/cloudinary-image-service";
import { PrismaImageReferenceRepository } from "@/server/media/image-reference-repository";

export class ReferencedImageError extends Error {
  constructor() {
    super("This image is still attached to catalog data.");
    this.name = "ReferencedImageError";
  }
}

export class ImageManagementService {
  constructor(
    private readonly references = new PrismaImageReferenceRepository(),
    private readonly storage = new CloudinaryImageService(),
  ) {}

  async removeUnreferenced(publicId: string) {
    if (await this.references.isReferenced(publicId)) {
      throw new ReferencedImageError();
    }
    await this.storage.remove(publicId);
  }

  async cleanupAfterReplacement(publicId: string) {
    try {
      await this.removeUnreferenced(publicId);
    } catch (error) {
      logger.warn("cloudinary.image.deferred_cleanup_required", {
        error,
        publicId,
      });
    }
  }
}
