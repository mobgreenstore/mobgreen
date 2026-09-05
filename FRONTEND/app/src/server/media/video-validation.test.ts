import { File } from "node:buffer";
import { describe, expect, it } from "vitest";
import { PRODUCT_VIDEO_UPLOAD_MAX_BYTES } from "@/config/product-video";
import { removeProductVideoSchema } from "@/server/media/schemas";
import { validateProductVideoFile } from "@/server/media/video-validation";

describe("product video boundary", () => {
  it("accepts a supported product video file", async () => {
    const file = new File(["video"], "spinach.mp4", {
      type: "video/mp4",
    }) as unknown as globalThis.File;

    await expect(validateProductVideoFile(file)).resolves.toMatchObject({
      buffer: expect.any(Buffer),
    });
  });

  it("rejects a video over the managed upload limit", async () => {
    const file = {
      size: PRODUCT_VIDEO_UPLOAD_MAX_BYTES + 1,
      type: "video/mp4",
    } as globalThis.File;

    await expect(validateProductVideoFile(file)).rejects.toMatchObject({
      code: "FILE_TOO_LARGE",
      status: 413,
    });
  });

  it("permits deletion only inside the product-video folder", () => {
    expect(
      removeProductVideoSchema.safeParse({
        publicId:
          "mob-greens/products/videos/124bf462-6765-451c-8db8-d47976ec9595",
      }).success,
    ).toBe(true);
    expect(
      removeProductVideoSchema.safeParse({ publicId: "other/video" }).success,
    ).toBe(false);
  });
});
