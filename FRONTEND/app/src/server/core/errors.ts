import { Prisma } from "@/generated/prisma/client";
import type { ServiceError } from "@/server/core/result";

export function mapPersistenceError(error: unknown): ServiceError {
  if (error instanceof Error && error.message === "CATEGORY_HAS_PRODUCTS") {
    return {
      code: "CONFLICT",
      message: "Move or archive this category’s products before archiving it.",
      cause: error,
    };
  }
  if (error instanceof Error && error.message === "CATEGORY_NOT_FOUND") {
    return {
      code: "NOT_FOUND",
      message: "The requested category was not found.",
      cause: error,
    };
  }
  if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
    return {
      code: "NOT_FOUND",
      message: "The requested product was not found.",
      cause: error,
    };
  }
  if (
    error instanceof Error &&
    error.message === "PRODUCT_CATEGORY_NOT_FOUND"
  ) {
    return {
      code: "VALIDATION_ERROR",
      message: "Choose an existing category.",
      cause: error,
    };
  }
  if (error instanceof Error && error.message === "PRODUCT_CATEGORY_ARCHIVED") {
    return {
      code: "CONFLICT",
      message: "Archived categories cannot receive products.",
      cause: error,
    };
  }
  if (error instanceof Error && error.message === "PRODUCT_CATEGORY_INACTIVE") {
    return {
      code: "CONFLICT",
      message: "Activate the category before activating this product.",
      cause: error,
    };
  }
  if (error instanceof Error && error.message === "PRODUCT_PRICE_REQUIRED") {
    return {
      code: "VALIDATION_ERROR",
      message: "Add at least one active price before activating this product.",
      cause: error,
    };
  }
  if (error instanceof Error && error.message === "ORDER_STATUS_CONFLICT") {
    return {
      code: "CONFLICT",
      message: "The order status changed before this update completed.",
      cause: error,
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return {
        code: "CONFLICT",
        message: "A record with this value already exists.",
        cause: error,
      };
    }
    if (error.code === "P2025") {
      return {
        code: "NOT_FOUND",
        message: "The requested record was not found.",
        cause: error,
      };
    }
  }

  return {
    code: "DATABASE_ERROR",
    message: "The database operation could not be completed.",
    cause: error,
  };
}
