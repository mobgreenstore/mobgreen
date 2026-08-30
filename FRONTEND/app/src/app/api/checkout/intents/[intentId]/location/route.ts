import { NextRequest } from "next/server";
import { ZodError } from "zod";
import {
  checkoutIntentIdSchema,
  updateIntentLocationSchema,
} from "@/features/delivery-matching/schema";
import {
  CheckoutIntentError,
  CheckoutIntentService,
} from "@/features/delivery-matching/server/checkout-intent-service";
import {
  checkoutThrottleKey,
  consumeCheckoutAttempt,
} from "@/features/checkout/server/rate-limit";
import { logger } from "@/server/core/logger";
import { requireGuestSession } from "@/server/guest-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientAddress(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function failure(
  message: string,
  code: string,
  status: number,
  fieldErrors?: Record<string, string[]>,
) {
  return Response.json(
    { error: message, code, ...(fieldErrors ? { fieldErrors } : {}) },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/checkout/intents/[intentId]/location">,
) {
  try {
    const guest = await requireGuestSession(request);
    const intentId = checkoutIntentIdSchema.parse(
      (await context.params).intentId,
    );
    if (!guest) return failure("Checkout not found.", "NOT_FOUND", 404);
    if (
      !(await consumeCheckoutAttempt(
        checkoutThrottleKey(intentId, clientAddress(request)),
      ))
    ) {
      return failure(
        "Too many matching attempts. Try again later.",
        "RATE_LIMITED",
        429,
      );
    }
    const body = await request.json();
    const input = updateIntentLocationSchema.parse({
      intentId,
      deliveryLocation: body.deliveryLocation,
    });
    const intent = await new CheckoutIntentService().updateLocation(
      guest.id,
      input,
    );
    return Response.json(
      { intent },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof ZodError)
      return failure(
        "Confirm the delivery location again.",
        "VALIDATION_ERROR",
        400,
      );
    if (error instanceof CheckoutIntentError)
      return failure(error.message, error.code, error.status);
    logger.error("checkout_intent.location_unexpected_error", { error });
    return failure(
      "The location could not be applied.",
      "CHECKOUT_FAILED",
      500,
    );
  }
}
