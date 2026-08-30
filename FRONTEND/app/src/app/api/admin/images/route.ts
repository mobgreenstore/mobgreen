import { ZodError } from "zod";
import { IMAGE_UPLOAD_MAX_BYTES } from "@/config/images";
import { authorizeAdminRoute } from "@/server/auth/authorization";
import { logger } from "@/server/core/logger";
import {
  CloudinaryImageError,
  CloudinaryImageService,
} from "@/server/media/cloudinary-image-service";
import {
  ImageManagementService,
  ReferencedImageError,
} from "@/server/media/image-management-service";
import {
  ImageValidationError,
  validateImageFile,
} from "@/server/media/image-validation";
import {
  removeImageSchema,
  uploadImageFieldsSchema,
} from "@/server/media/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(message: string, code: string, status: number) {
  return Response.json({ error: message, code }, { status });
}

export async function POST(request: Request) {
  const authorization = await authorizeAdminRoute("catalog.write");
  if (!authorization.ok) return authorization.response;

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > IMAGE_UPLOAD_MAX_BYTES + 1024 * 1024) {
    return errorResponse(
      "The image exceeds the 50 MB limit.",
      "FILE_TOO_LARGE",
      413,
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return errorResponse("Choose an image to upload.", "FILE_REQUIRED", 400);
    }
    const fields = uploadImageFieldsSchema.parse({
      scope: formData.get("scope"),
      altText: formData.get("altText"),
    });
    const { buffer } = await validateImageFile(file);
    const image = await new CloudinaryImageService().upload({
      buffer,
      scope: fields.scope,
      altText: fields.altText,
    });
    logger.info("cloudinary.image.uploaded", {
      adminId: authorization.admin.id,
      scope: fields.scope,
      bytes: image.bytes,
      width: image.width,
      height: image.height,
    });
    return Response.json({ image }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        error.issues[0]?.message ?? "Check the upload details.",
        "INVALID_UPLOAD",
        400,
      );
    }
    if (error instanceof ImageValidationError) {
      return errorResponse(error.message, error.code, error.status);
    }
    if (error instanceof CloudinaryImageError) {
      return errorResponse(error.message, "UPLOAD_FAILED", 502);
    }
    logger.error("cloudinary.image.upload_unexpected_error", { error });
    return errorResponse(
      "The image could not be uploaded. Try again.",
      "UPLOAD_FAILED",
      500,
    );
  }
}

export async function DELETE(request: Request) {
  const authorization = await authorizeAdminRoute("catalog.write");
  if (!authorization.ok) return authorization.response;

  try {
    const input = removeImageSchema.parse(await request.json());
    await new ImageManagementService().removeUnreferenced(input.publicId);
    logger.info("cloudinary.image.removed", {
      adminId: authorization.admin.id,
    });
    return Response.json({ removed: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        error.issues[0]?.message ?? "Invalid image key.",
        "INVALID_IMAGE_KEY",
        400,
      );
    }
    if (error instanceof ReferencedImageError) {
      return errorResponse(error.message, "IMAGE_REFERENCED", 409);
    }
    if (error instanceof CloudinaryImageError) {
      return errorResponse(error.message, "REMOVE_FAILED", 502);
    }
    logger.error("cloudinary.image.remove_unexpected_error", { error });
    return errorResponse(
      "The image could not be removed. Try again.",
      "REMOVE_FAILED",
      500,
    );
  }
}
