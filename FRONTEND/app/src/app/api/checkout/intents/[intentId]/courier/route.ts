import { NextRequest } from "next/server";
import { ZodError } from "zod";
import {
  checkoutIntentIdSchema,
  selectCourierSchema,
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

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/checkout/intents/[intentId]/courier">,
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
    const input = selectCourierSchema.parse({
      intentId,
      courierCandidateId: body.courierCandidateId,
    });
    const intent = await new CheckoutIntentService().selectCourier(
      guest.id,
      input,
    );
    logger.info("checkout_intent.courier_selected", {
      intentId,
      candidateId: intent.selectedCourier?.candidateId,
    });
    return Response.json(
      { intent },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof ZodError)
      return failure(
        "Choose an available delivery profile.",
        "VALIDATION_ERROR",
        400,
      );
    if (error instanceof CheckoutIntentError)
      return failure(error.message, error.code, error.status);
    logger.error("checkout_intent.courier_unexpected_error", { error });
    return failure(
      "The delivery profile could not be selected.",
      "CHECKOUT_FAILED",
      500,
    );
  }
}
