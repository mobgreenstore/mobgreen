import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { CheckoutError } from "@/features/checkout/server/guest-checkout-service";
import {
  checkoutThrottleKey,
  consumeCheckoutAttempt,
} from "@/features/checkout/server/rate-limit";
import {
  checkoutIntentIdSchema,
  finalizeCheckoutSchema,
} from "@/features/delivery-matching/schema";
import { CheckoutFinalizeService } from "@/features/delivery-matching/server/checkout-finalize-service";
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

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/checkout/intents/[intentId]/submit">,
) {
  try {
    const intentId = checkoutIntentIdSchema.parse(
      (await context.params).intentId,
    );
    const body = await request.json();
    const input = finalizeCheckoutSchema.parse({ ...body, intentId });
    const guest = await requireGuestSession(request);
    if (!guest) {
      return failure(
        "The checkout could not be continued. Start checkout again.",
        "CHECKOUT_NOT_FOUND",
        404,
      );
    }
    if (
      !(await consumeCheckoutAttempt(
        checkoutThrottleKey(intentId, clientAddress(request)),
      ))
    ) {
      return failure(
        "Too many confirmation attempts. Try again later.",
        "RATE_LIMITED",
        429,
      );
    }
    const order = await new CheckoutFinalizeService().createFromIntent(
      input,
      guest,
    );
    logger.info("checkout_intent.submitted", {
      intentId,
      reference: order.reference,
      duplicate: order.duplicate,
    });
    return Response.json(
      { order },
      {
        status: order.duplicate ? 200 : 201,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure(
        "Check the highlighted confirmation details.",
        "VALIDATION_ERROR",
        400,
        error.flatten().fieldErrors,
      );
    }
    if (error instanceof CheckoutError) {
      return failure(error.message, error.code, error.status);
    }
    logger.error("checkout_intent.submit_unexpected_error", { error });
    return failure(
      "Order could not be submitted. Try again.",
      "ORDER_FAILED",
      500,
    );
  }
}
