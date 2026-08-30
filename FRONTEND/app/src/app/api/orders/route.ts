import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { guestCheckoutSchema } from "@/features/checkout/schema";
import {
  CheckoutError,
  GuestCheckoutService,
} from "@/features/checkout/server/guest-checkout-service";
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

function errorResponse(
  message: string,
  code: string,
  status: number,
  fieldErrors?: Record<string, string[]>,
) {
  return Response.json(
    { error: message, code, ...(fieldErrors ? { fieldErrors } : {}) },
    { status },
  );
}

function clientAddress(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  try {
    const input = guestCheckoutSchema.parse(await request.json());
    const throttleKey = checkoutThrottleKey(
      input.customerEmail,
      clientAddress(request),
    );
    if (!(await consumeCheckoutAttempt(throttleKey))) {
      return errorResponse(
        "Too many order attempts. Try again later.",
        "RATE_LIMITED",
        429,
      );
    }

    const guest = await prepareGuestSession(request);
    const order = await new GuestCheckoutService().create(input, guest);
    logger.info("guest_order.created", {
      reference: order.reference,
      paymentMethod: input.paymentMethod,
      fulfillmentType: input.fulfillmentType,
      duplicate: order.duplicate,
    });
    const response = NextResponse.json(
      { order },
      { status: order.duplicate ? 200 : 201 },
    );
    setGuestSessionCookie(response, guest);
    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        "Check the highlighted checkout details.",
        "VALIDATION_ERROR",
        400,
        error.flatten().fieldErrors,
      );
    }
    if (error instanceof CheckoutError) {
      return errorResponse(error.message, error.code, error.status);
    }
    logger.error("guest_order.create_unexpected_error", { error });
    return errorResponse(
      "The order could not be placed. Try again.",
      "ORDER_FAILED",
      500,
    );
  }
}
