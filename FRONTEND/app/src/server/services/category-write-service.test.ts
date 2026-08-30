import type { Category } from "@/generated/prisma/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/repositories/prisma", () => ({
  PrismaCategoryRepository: class {},
}));
import type { CategoryRepository } from "@/server/repositories/contracts";
import { CategoryWriteService } from "@/server/services/category-write-service";

const now = new Date("2026-01-01T00:00:00.000Z");
const category: Category = {
  id: "124bf462-6765-451c-8db8-d47976ec9595",
  name: "Greens",
  slug: "greens",
  description: null,
  imagePublicId: null,
  imageUrl: null,
  imageAltText: null,
  imageWidth: null,
  imageHeight: null,
  position: 0,
  displayTone: "MIST",
  isActive: true,
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
};

function repository(): CategoryRepository {
  return {
    findById: vi.fn(),
    findBySlug: vi.fn().mockResolvedValue(null),
    list: vi.fn(),
    countProducts: vi.fn().mockResolvedValue(0),
    create: vi.fn().mockResolvedValue(category),
    update: vi.fn(),
    activate: vi.fn(),
    archive: vi.fn(),
    reorder: vi.fn(),
  };
}

describe("CategoryWriteService", () => {
  it("validates and normalizes data before calling its repository", async () => {
    const storage = repository();
    const service = new CategoryWriteService(storage);
    const result = await service.create({ name: " Greens " });
    expect(result.ok).toBe(true);
    expect(storage.create).toHaveBeenCalledWith({
      name: "Greens",
      slug: "greens",
      position: 0,
      displayTone: "MIST",
      isActive: true,
    });
  });
  it("cleans up a replaced Cloudinary asset only after the database update", async () => {
    const storage = repository();
    const oldPublicId =
      "mob-greens/categories/124bf462-6765-451c-8db8-d47976ec9595";
    const newPublicId =
      "mob-greens/categories/224bf462-6765-451c-8db8-d47976ec9595";
    const current = {
      ...category,
      imagePublicId: oldPublicId,
      imageUrl: "https://res.cloudinary.com/demo/image/upload/old.webp",
      imageAltText: "Old category image",
      imageWidth: 800,
      imageHeight: 600,
    };
    const updated = {
      ...current,
      imagePublicId: newPublicId,
      imageUrl: "https://res.cloudinary.com/demo/image/upload/new.webp",
      imageAltText: "New category image",
    };
    vi.mocked(storage.findById).mockResolvedValue(current);
    vi.mocked(storage.update).mockResolvedValue(updated);
    const cleanupAfterReplacement = vi.fn().mockResolvedValue(undefined);
    const service = new CategoryWriteService(storage, {
      cleanupAfterReplacement,
    });

    const result = await service.update(category.id, {
      name: category.name,
      isActive: true,
      image: {
        publicId: newPublicId,
        url: updated.imageUrl,
        altText: updated.imageAltText,
        width: 800,
        height: 600,
      },
    });

    expect(result.ok).toBe(true);
    expect(vi.mocked(storage.update).mock.invocationCallOrder[0]).toBeLessThan(
      cleanupAfterReplacement.mock.invocationCallOrder[0] ?? Infinity,
    );
    expect(cleanupAfterReplacement).toHaveBeenCalledWith(oldPublicId);
  });
});
