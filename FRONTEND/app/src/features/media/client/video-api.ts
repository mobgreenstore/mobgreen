"use client";

import {
  PRODUCT_VIDEO_UPLOAD_MAX_BYTES,
  PRODUCT_VIDEO_UPLOAD_MAX_LABEL,
  PRODUCT_VIDEO_UPLOAD_MIME_TYPES,
} from "@/config/product-video";
import type {
  ImageApiError,
  ManagedVideo,
  VideoUploadResponse,
} from "@/types/media";

export function validateClientProductVideoFile(file: File): string | null {
  if (!file.size) return "Choose a non-empty video.";
  if (file.size > PRODUCT_VIDEO_UPLOAD_MAX_BYTES) {
    return `The video exceeds the ${PRODUCT_VIDEO_UPLOAD_MAX_LABEL} limit.`;
  }
  if (!PRODUCT_VIDEO_UPLOAD_MIME_TYPES.includes(file.type as never)) {
    return "Use an MP4, WebM, or MOV video.";
  }
  return null;
}

export function uploadAdminProductVideo(input: {
  file: File;
  altText: string;
  onProgress: (progress: number) => void;
}): Promise<ManagedVideo> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/admin/product-video");
    request.responseType = "json";
    request.withCredentials = true;
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        input.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      const body = request.response as
        VideoUploadResponse | ImageApiError | null;
      if (
        request.status >= 200 &&
        request.status < 300 &&
        body &&
        "video" in body
      ) {
        resolve(body.video);
        return;
      }
      reject(
        new Error(
          request.status === 401
            ? "Your admin session expired. Refresh the page and sign in again."
            : body && "error" in body
              ? body.error
              : "The video could not be uploaded. Try again.",
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
    request.send(formData);
  });
}

export async function removeAdminProductVideo(publicId: string) {
  const response = await fetch("/api/admin/product-video", {
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
      : (body?.error ?? "The video could not be removed. Try again."),
  );
}
