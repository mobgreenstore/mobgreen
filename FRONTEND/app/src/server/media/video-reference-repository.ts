import "server-only";

import { prisma } from "@/server/db/client";

export class PrismaVideoReferenceRepository {
  async isReferenced(publicId: string) {
    const video = await prisma.productVideo.findUnique({
      where: { cloudinaryPublicId: publicId },
      select: { id: true },
    });
    return Boolean(video);
  }
}
