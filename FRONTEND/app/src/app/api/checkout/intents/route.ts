import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { startCheckoutIntentSchema } from "@/features/delivery-matching/schema";
import {
  CheckoutIntentError,
  CheckoutIntentService,
} from "@/features/delivery-matching/server/checkout-intent-service";
import {
  checkoutThrottleKey,
  consumeCheckoutAttempt,
} from "@/features/checkout/server/rate-limit";
import { logger } from "@/server/core/logger";
import {
  prepareGuestSession,
  setGuestSessionCookie,
} from "@/server/guest-session";

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

export async function POST(request: NextRequest) {
  try {
    const input = startCheckoutIntentSchema.parse(await request.json());
    if (
      !(await consumeCheckoutAttempt(
        checkoutThrottleKey(input.customerEmail, clientAddress(request)),
      ))
    ) {
      return failure(
        "Too many checkout attempts. Try again later.",
        "RATE_LIMITED",
        429,
      );
    }
    const guest = await prepareGuestSession(request);
    const intent = await new CheckoutIntentService().create(input, guest);
    logger.info("checkout_intent.created", {
      intentId: intent.publicId,
      fulfillmentType: intent.fulfillmentType,
      hasLocation: Boolean(intent.location),
    });
    const response = NextResponse.json(
      { intent },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
    setGuestSessionCookie(response, guest);
    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return failure(
        "Check the highlighted checkout details.",
        "VALIDATION_ERROR",
        400,
        error.flatten().fieldErrors,
      );
    }
    if (error instanceof CheckoutIntentError)
      return failure(error.message, error.code, error.status);
    logger.error("checkout_intent.create_unexpected_error", { error });
    return failure(
      "Checkout could not be started. Try again.",
      "CHECKOUT_FAILED",
      500,
    );
  }
}
