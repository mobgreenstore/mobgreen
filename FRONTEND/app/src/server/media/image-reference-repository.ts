import "server-only";

import { prisma } from "@/server/db/client";

export class PrismaImageReferenceRepository {
  async isReferenced(publicId: string) {
    const [category, productImage] = await Promise.all([
      prisma.category.findFirst({
        where: { imagePublicId: publicId },
        select: { id: true },
      }),
      prisma.productImage.findUnique({
        where: { cloudinaryPublicId: publicId },
        select: { id: true },
      }),
    ]);
    return Boolean(category || productImage);
  }
}
