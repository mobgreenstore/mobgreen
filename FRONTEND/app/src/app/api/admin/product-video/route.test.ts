import { beforeEach, describe, expect, it, vi } from "vitest";

const authorize = vi.hoisted(() => vi.fn());
const removeUnreferenced = vi.hoisted(() => vi.fn());
const upload = vi.hoisted(() => vi.fn());
const validateProductVideoFile = vi.hoisted(() => vi.fn());

vi.mock("@/server/auth/authorization", () => ({
  authorizeAdminRoute: authorize,
}));
vi.mock("@/server/media/video-management-service", () => ({
  VideoManagementService: class {
    removeUnreferenced = removeUnreferenced;
  },
  ReferencedVideoError: class ReferencedVideoError extends Error {},
}));
vi.mock("@/server/media/cloudinary-video-service", () => ({
  CloudinaryVideoService: class {
    upload = upload;
  },
  CloudinaryVideoError: class CloudinaryVideoError extends Error {},
}));
vi.mock("@/server/media/video-validation", () => ({
  validateProductVideoFile,
  VideoValidationError: class VideoValidationError extends Error {},
}));

const route = await import("@/app/api/admin/product-video/route");

describe("admin product video route", () => {
  beforeEach(() => {
    authorize.mockReset();
    removeUnreferenced.mockReset();
    upload.mockReset();
    validateProductVideoFile.mockReset();
  });

  it("authorizes and uploads a validated video", async () => {
    authorize.mockResolvedValue({ ok: true, admin: { id: "admin-id" } });
    validateProductVideoFile.mockResolvedValue({
      buffer: Buffer.from("video"),
    });
    upload.mockResolvedValue({
      id: "video-id",
      publicId:
        "mob-greens/products/videos/124bf462-6765-451c-8db8-d47976ec9595",
      url: "https://res.cloudinary.com/demo/video/upload/spinach.mp4",
      posterUrl: "https://res.cloudinary.com/demo/video/upload/spinach.jpg",
      altText: "Fresh spinach leaves",
      width: 1280,
      height: 720,
      durationSeconds: 10,
      persisted: false,
    });
    const formData = new FormData();
    formData.set(
      "file",
      new File(["video"], "spinach.mp4", { type: "video/mp4" }),
    );
    formData.set("altText", "Fresh spinach leaves");

    const response = await route.POST(
      new Request("http://localhost/api/admin/product-video", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(201);
    expect(authorize).toHaveBeenCalledWith("catalog.write");
    expect(validateProductVideoFile).toHaveBeenCalled();
    expect(upload).toHaveBeenCalledWith({
      buffer: expect.any(Buffer),
      altText: "Fresh spinach leaves",
    });
  });

  it("rejects unauthenticated deletion before touching storage", async () => {
    authorize.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const response = await route.DELETE(
      new Request("http://localhost/api/admin/product-video", {
        method: "DELETE",
      }),
    );

    expect(response.status).toBe(401);
    expect(removeUnreferenced).not.toHaveBeenCalled();
  });
});
