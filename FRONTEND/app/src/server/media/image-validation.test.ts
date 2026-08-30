import { File } from "node:buffer";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { IMAGE_UPLOAD_MAX_BYTES } from "@/config/images";
import { validateImageFile } from "@/server/media/image-validation";
import { removeImageSchema } from "@/server/media/schemas";

describe("server image boundary", () => {
  it("decodes a real supported image before accepting it", async () => {
    const buffer = await sharp({
      create: {
        width: 320,
        height: 240,
        channels: 3,
        background: "#ffffff",
      },
    })
      .webp()
      .toBuffer();
    const file = new File([buffer], "phone.webp", {
      type: "image/webp",
    }) as unknown as globalThis.File;

    const result = await validateImageFile(file);
    expect(result.metadata).toMatchObject({
      format: "webp",
      width: 320,
      height: 240,
    });
  });

  it("rejects oversized files before decoding them", async () => {
    const file = {
      size: IMAGE_UPLOAD_MAX_BYTES + 1,
      type: "image/jpeg",
    } as globalThis.File;
    await expect(validateImageFile(file)).rejects.toMatchObject({
      code: "FILE_TOO_LARGE",
      status: 413,
    });
  });

  it("only permits deletion keys created inside managed folders", () => {
    expect(
      removeImageSchema.safeParse({
        publicId: "mob-greens/products/124bf462-6765-451c-8db8-d47976ec9595",
      }).success,
    ).toBe(true);
    expect(
      removeImageSchema.safeParse({ publicId: "someone-elses/asset" }).success,
    ).toBe(false);
  });
});
