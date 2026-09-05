import { ZodError } from "zod";
import { PRODUCT_VIDEO_UPLOAD_MAX_BYTES } from "@/config/product-video";
import { authorizeAdminRoute } from "@/server/auth/authorization";
import { logger } from "@/server/core/logger";
import {
  CloudinaryVideoError,
  CloudinaryVideoService,
} from "@/server/media/cloudinary-video-service";
import {
  ReferencedVideoError,
  VideoManagementService,
} from "@/server/media/video-management-service";
import {
  removeProductVideoSchema,
  uploadProductVideoFieldsSchema,
} from "@/server/media/schemas";
import {
  validateProductVideoFile,
  VideoValidationError,
} from "@/server/media/video-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(message: string, code: string, status: number) {
  return Response.json({ error: message, code }, { status });
}

export async function POST(request: Request) {
  const authorization = await authorizeAdminRoute("catalog.write");
  if (!authorization.ok) return authorization.response;

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > PRODUCT_VIDEO_UPLOAD_MAX_BYTES + 2 * 1024 * 1024) {
    return errorResponse(
      "The video exceeds the 100 MB limit.",
      "FILE_TOO_LARGE",
      413,
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return errorResponse("Choose a video to upload.", "FILE_REQUIRED", 400);
    }
    const fields = uploadProductVideoFieldsSchema.parse({
      altText: formData.get("altText"),
    });
    const { buffer } = await validateProductVideoFile(file);
    const video = await new CloudinaryVideoService().upload({
      buffer,
      altText: fields.altText,
    });
    logger.info("cloudinary.product_video.uploaded", {
      adminId: authorization.admin.id,
      width: video.width,
      height: video.height,
      durationSeconds: video.durationSeconds,
    });
    return Response.json({ video }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        error.issues[0]?.message ?? "Check the upload details.",
        "INVALID_UPLOAD",
        400,
      );
    }
    if (error instanceof VideoValidationError) {
      return errorResponse(error.message, error.code, error.status);
    }
    if (error instanceof CloudinaryVideoError) {
      return errorResponse(error.message, "UPLOAD_FAILED", 502);
    }
    logger.error("cloudinary.product_video.upload_unexpected_error", { error });
    return errorResponse(
      "The video could not be uploaded. Try again.",
      "UPLOAD_FAILED",
      500,
    );
  }
}

export async function DELETE(request: Request) {
  const authorization = await authorizeAdminRoute("catalog.write");
  if (!authorization.ok) return authorization.response;

  try {
    const input = removeProductVideoSchema.parse(await request.json());
    await new VideoManagementService().removeUnreferenced(input.publicId);
    logger.info("cloudinary.product_video.removed", {
      adminId: authorization.admin.id,
    });
    return Response.json({ removed: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        error.issues[0]?.message ?? "Invalid video key.",
        "INVALID_VIDEO_KEY",
        400,
      );
    }
    if (error instanceof ReferencedVideoError) {
      return errorResponse(error.message, "VIDEO_REFERENCED", 409);
    }
    if (error instanceof CloudinaryVideoError) {
      return errorResponse(error.message, "REMOVE_FAILED", 502);
    }
    logger.error("cloudinary.product_video.remove_unexpected_error", { error });
    return errorResponse(
      "The video could not be removed. Try again.",
      "REMOVE_FAILED",
      500,
    );
  }
}
