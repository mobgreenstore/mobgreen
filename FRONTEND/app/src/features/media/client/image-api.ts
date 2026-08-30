"use client";

import {
  IMAGE_UPLOAD_MAX_BYTES,
  IMAGE_UPLOAD_MAX_LABEL,
  IMAGE_UPLOAD_MIME_TYPES,
  type ImageUploadScope,
} from "@/config/images";
import type {
  ImageApiError,
  ImageUploadResponse,
  ManagedImage,
} from "@/types/media";

export function validateClientImageFile(file: File): string | null {
  if (!file.size) return "Choose a non-empty image.";
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    return `The image exceeds the ${IMAGE_UPLOAD_MAX_LABEL} limit.`;
  }
  if (!IMAGE_UPLOAD_MIME_TYPES.includes(file.type as never)) {
    return "Use a JPEG, PNG, WebP, or AVIF image.";
  }
  return null;
}

export function uploadAdminImage(input: {
  file: File;
  altText: string;
  scope: ImageUploadScope;
  onProgress: (progress: number) => void;
}): Promise<ManagedImage> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/admin/images");
    request.responseType = "json";
    request.withCredentials = true;
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        input.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      const body = request.response as
        ImageUploadResponse | ImageApiError | null;
      if (
        request.status >= 200 &&
        request.status < 300 &&
        body &&
        "image" in body
      ) {
        resolve(body.image);
        return;
      }
      reject(
        new Error(
          request.status === 401
            ? "Your admin session expired. Refresh the page and sign in again."
            : body && "error" in body
              ? body.error
              : "The image could not be uploaded. Try again.",
        ),
      );
    });
    request.addEventListener("error", () => {
      reject(new Error("The network interrupted the upload. Try again."));
    });
    request.addEventListener("abort", () => {
      reject(new Error("The upload was cancelled."));
    });

    const formData = new FormData();
    formData.set("file", input.file);
    formData.set("altText", input.altText);
    formData.set("scope", input.scope);
    request.send(formData);
  });
}

export async function removeAdminImage(publicId: string) {
  const response = await fetch("/api/admin/images", {
    method: "DELETE",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ publicId }),
  });
  if (response.ok) return;
  const body = (await response
    .json()
    .catch(() => null)) as ImageApiError | null;
  throw new Error(
    response.status === 401
      ? "Your admin session expired. Refresh the page and sign in again."
      : (body?.error ?? "The image could not be removed. Try again."),
  );
}
