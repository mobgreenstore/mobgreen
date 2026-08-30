// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImageReorderGrid } from "@/components/admin/image-reorder-grid";
import { ImageUploader } from "@/components/admin/image-uploader";
import { IMAGE_UPLOAD_MAX_BYTES } from "@/config/images";
import {
  uploadAdminImage,
  validateClientImageFile,
} from "@/features/media/client/image-api";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

class SuccessfulUploadRequest {
  static lastBody: Document | XMLHttpRequestBodyInit | null;
  static lastWithCredentials = false;
  responseType: XMLHttpRequestResponseType = "";
  withCredentials = false;
  status = 201;
  response = {
    image: {
      id: "asset-id",
      publicId: "mob-greens/categories/124bf462-6765-451c-8db8-d47976ec9595",
      url: "https://res.cloudinary.com/demo/image/upload/category.webp",
      altText: "Fresh spinach leaves",
      width: 1200,
      height: 900,
      bytes: 100,
      format: "webp",
      position: 0,
      isCover: true,
      persisted: false,
    },
  };
  upload = {
    addEventListener: (
      event: string,
      listener: (event: ProgressEvent) => void,
    ) => {
      if (event === "progress") {
        this.progressListener = listener;
      }
    },
  };
  private progressListener?: (event: ProgressEvent) => void;
  private listeners = new Map<string, () => void>();

  open() {}
  addEventListener(event: string, listener: () => void) {
    this.listeners.set(event, listener);
  }
  send(body: Document | XMLHttpRequestBodyInit | null) {
    SuccessfulUploadRequest.lastBody = body;
    SuccessfulUploadRequest.lastWithCredentials = this.withCredentials;
    this.progressListener?.({
      lengthComputable: true,
      loaded: 100,
      total: 100,
    } as ProgressEvent);
    this.listeners.get("load")?.();
  }
}

class UnauthorizedUploadRequest {
  responseType: XMLHttpRequestResponseType = "";
  withCredentials = false;
  status = 401;
  response = { error: "Unauthorized" };
  upload = { addEventListener: () => undefined };
  private listeners = new Map<string, () => void>();

  open() {}
  addEventListener(event: string, listener: () => void) {
    this.listeners.set(event, listener);
  }
  send() {
    this.listeners.get("load")?.();
  }
}

describe("real image upload interface", () => {
  it("accepts a phone camera image and sends it through the authenticated workflow", async () => {
    vi.stubGlobal(
      "XMLHttpRequest",
      SuccessfulUploadRequest as unknown as typeof XMLHttpRequest,
    );
    const onImagesChange = vi.fn();
    const onUploadProgressChange = vi.fn();
    const { container } = render(
      <ImageUploader
        scope="category"
        images={[]}
        onImagesChange={onImagesChange}
        onUploadProgressChange={onUploadProgressChange}
        maxFiles={1}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Image description/), {
      target: { value: "Fresh spinach leaves" },
    });
    const phonePhoto = new File(["phone-image"], "IMG_20260813.webp", {
      type: "image/webp",
    });
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [phonePhoto] },
    });

    await waitFor(() => expect(onImagesChange).toHaveBeenCalledTimes(1));
    expect(SuccessfulUploadRequest.lastBody).toBeInstanceOf(FormData);
    expect(SuccessfulUploadRequest.lastWithCredentials).toBe(true);
    expect(onUploadProgressChange).toHaveBeenCalledWith({
      status: "uploading",
      progress: 100,
    });
    expect(onUploadProgressChange).toHaveBeenLastCalledWith({
      status: "success",
      progress: 100,
    });
    expect(onImagesChange).toHaveBeenCalledWith([
      expect.objectContaining({
        altText: "Fresh spinach leaves",
        isCover: true,
        position: 0,
      }),
    ]);
  });

  it("returns actionable feedback when the admin session is unavailable", async () => {
    vi.stubGlobal(
      "XMLHttpRequest",
      UnauthorizedUploadRequest as unknown as typeof XMLHttpRequest,
    );
    await expect(
      uploadAdminImage({
        file: new File(["image"], "category.webp", { type: "image/webp" }),
        altText: "Fresh leafy greens",
        scope: "category",
        onProgress: vi.fn(),
      }),
    ).rejects.toThrow(
      "Your admin session expired. Refresh the page and sign in again.",
    );
  });

  it("rejects files above 50 MB before network upload", () => {
    const file = new File(["x"], "too-large.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", {
      value: IMAGE_UPLOAD_MAX_BYTES + 1,
    });
    expect(validateClientImageFile(file)).toBe(
      "The image exceeds the 50 MB limit.",
    );
  });
  it("exposes accessible reorder, cover, remove, and alt-text controls", () => {
    const onMove = vi.fn();
    const onCoverChange = vi.fn();
    const onRemove = vi.fn();
    const onAltTextChange = vi.fn();
    render(
      <ImageReorderGrid
        images={[
          {
            id: "first",
            url: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
            altText: "First image",
            width: 1,
            height: 1,
          },
          {
            id: "second",
            url: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
            altText: "Second image",
            width: 1,
            height: 1,
          },
        ]}
        coverImageId="first"
        onMove={onMove}
        onRemove={onRemove}
        onCoverChange={onCoverChange}
        onAltTextChange={onAltTextChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Move First image forward" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Set Second image as cover" }),
    );
    fireEvent.change(screen.getByDisplayValue("Second image"), {
      target: { value: "Second spinach view" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Remove Second image" }),
    );

    expect(onMove).toHaveBeenCalledWith("first", "forward");
    expect(onCoverChange).toHaveBeenCalledWith("second");
    expect(onAltTextChange).toHaveBeenCalledWith(
      "second",
      "Second spinach view",
    );
    expect(onRemove).toHaveBeenCalledWith("second");
  });
});
