import { ZodError } from "zod";
import { validateCartRequestSchema } from "@/features/cart/schema";
import { PrismaCartRepository } from "@/features/cart/server/prisma-cart-repository";
import { CartValidationService } from "@/features/cart/server/cart-validation-service";
import { logger } from "@/server/core/logger";
import {
  DEFAULT_STOREFRONT_CURRENCY,
  isSupportedCurrency,
  STOREFRONT_CURRENCY_COOKIE,
} from "@/features/catalog/currency-preference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CART_REQUEST_BYTES = 16 * 1024;

function errorResponse(message: string, code: string, status: number) {
  return Response.json({ error: message, code }, { status });
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_CART_REQUEST_BYTES) {
    return errorResponse(
      "The card request is too large.",
      "CART_TOO_LARGE",
      413,
    );
  }

  try {
    const input = validateCartRequestSchema.parse(await request.json());
    const rawCurrency = request.headers
      .get("cookie")
      ?.match(
        new RegExp(`(?:^|;\\s*)${STOREFRONT_CURRENCY_COOKIE}=([^;]+)`),
      )?.[1];
    const currency = isSupportedCurrency(rawCurrency)
      ? rawCurrency
      : DEFAULT_STOREFRONT_CURRENCY;
    const cart = await new CartValidationService(
      new PrismaCartRepository(),
    ).validate(input.lines, currency);
    return Response.json({ cart });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof ZodError) {
      return errorResponse(
        "The card contains invalid selections.",
        "INVALID_CART",
        400,
      );
    }
    logger.error("cart.validation_unexpected_error", { error });
    return errorResponse(
      "The card could not be refreshed. Try again.",
      "CART_REFRESH_FAILED",
      500,
    );
  }
}
