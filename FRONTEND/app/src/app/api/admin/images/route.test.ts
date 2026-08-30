import { beforeEach, describe, expect, it, vi } from "vitest";

const authorize = vi.hoisted(() => vi.fn());
const removeUnreferenced = vi.hoisted(() => vi.fn());
const upload = vi.hoisted(() => vi.fn());
const validateImageFile = vi.hoisted(() => vi.fn());

vi.mock("@/server/auth/authorization", () => ({
  authorizeAdminRoute: authorize,
}));
vi.mock("@/server/media/image-management-service", () => ({
  ImageManagementService: class {
    removeUnreferenced = removeUnreferenced;
  },
  ReferencedImageError: class ReferencedImageError extends Error {},
}));
vi.mock("@/server/media/cloudinary-image-service", () => ({
  CloudinaryImageService: class {
    upload = upload;
  },
  CloudinaryImageError: class CloudinaryImageError extends Error {},
}));
vi.mock("@/server/media/image-validation", () => ({
  validateImageFile,
  ImageValidationError: class ImageValidationError extends Error {},
}));

const route = await import("@/app/api/admin/images/route");

describe("admin image route authorization", () => {
  beforeEach(() => {
    authorize.mockReset();
    removeUnreferenced.mockReset();
    upload.mockReset();
    validateImageFile.mockReset();
  });

  it("rejects unauthenticated deletion before touching storage", async () => {
    authorize.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });
    const response = await route.DELETE(
      new Request("http://localhost/api/admin/images", { method: "DELETE" }),
    );
    expect(response.status).toBe(401);
    expect(removeUnreferenced).not.toHaveBeenCalled();
  });

  it("authorizes and removes only through the safe management service", async () => {
    authorize.mockResolvedValue({
      ok: true,
      admin: { id: "admin-id" },
    });
    removeUnreferenced.mockResolvedValue(undefined);
    const publicId =
      "mob-greens/categories/124bf462-6765-451c-8db8-d47976ec9595";
    const response = await route.DELETE(
      new Request("http://localhost/api/admin/images", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ publicId }),
      }),
    );
    expect(response.status).toBe(200);
    expect(removeUnreferenced).toHaveBeenCalledWith(publicId);
    expect(authorize).toHaveBeenCalledWith("catalog.write");
  });

  it("allows an authorized upload to reach validated Cloudinary storage", async () => {
    authorize.mockResolvedValue({
      ok: true,
      admin: { id: "admin-id" },
    });
    validateImageFile.mockResolvedValue({ buffer: Buffer.from("image") });
    upload.mockResolvedValue({
      id: "image-id",
      publicId: "mob-greens/categories/124bf462-6765-451c-8db8-d47976ec9595",
      url: "https://res.cloudinary.com/demo/image/upload/category.webp",
      altText: "Fresh leafy greens",
      width: 1200,
      height: 800,
      bytes: 500,
      position: 0,
      isCover: true,
      persisted: false,
    });
    const formData = new FormData();
    formData.set(
      "file",
      new File(["image"], "category.webp", { type: "image/webp" }),
    );
    formData.set("scope", "category");
    formData.set("altText", "Fresh leafy greens");

    const response = await route.POST(
      new Request("http://localhost/api/admin/images", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(201);
    expect(authorize).toHaveBeenCalledWith("catalog.write");
    expect(validateImageFile).toHaveBeenCalled();
    expect(upload).toHaveBeenCalledWith({
      buffer: expect.any(Buffer),
      scope: "category",
      altText: "Fresh leafy greens",
    });
  });

  it("rejects multipart requests larger than the configured file limit", async () => {
    authorize.mockResolvedValue({
      ok: true,
      admin: { id: "admin-id" },
    });
    const response = await route.POST(
      new Request("http://localhost/api/admin/images", {
        method: "POST",
        headers: { "content-length": String(52 * 1024 * 1024) },
      }),
    );
    expect(response.status).toBe(413);
    expect(upload).not.toHaveBeenCalled();
  });
});
