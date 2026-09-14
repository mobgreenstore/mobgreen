import { NextRequest, NextResponse } from "next/server";
import type { Currency } from "@/generated/prisma/client";
import {
  checkoutThrottleKey,
  consumeCheckoutAttempt,
} from "@/features/checkout/server/rate-limit";
import { createDirectVerificationOrder } from "@/features/payments/server/direct-verification-service";
import {
  dispatchCustomerOrderSubmittedNotification,
  dispatchOrderSubmittedNotification,
} from "@/features/order-notifications/server/service";
import { logger } from "@/server/core/logger";
import {
  prepareGuestSession,
  setGuestSessionCookie,
} from "@/server/guest-session";

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

function clientAddress(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function dispatchDirectVerificationNotifications(reference: string) {
  setImmediate(() => {
    void Promise.all([
      dispatchOrderSubmittedNotification(reference),
      dispatchCustomerOrderSubmittedNotification(reference),
    ]).catch((error) => {
      logger.error("direct_verification.notification_dispatch_failed", {
        reference,
        error,
      });
    });
  });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const customerName = body.customerName?.trim();
    const customerEmail = body.customerEmail?.trim()?.toLowerCase();
    const orderAmount = parseFloat(body.orderAmount);
    const currency = body.currency?.toUpperCase() || "EUR";
    const paymentMethod = body.paymentMethod;
    const rechargePartner = (
      body.rechargePartner ?? body.rechargeProvider
    )?.trim();
    const verificationCodes = body.verificationCodes || [];

    if (!customerName || customerName.length < 2) {
      return failure("Full name is required", "VALIDATION_ERROR", 400, {
        customerName: ["Full name is required"],
      });
    }
    if (!customerEmail || !customerEmail.includes("@")) {
      return failure("Valid email is required", "VALIDATION_ERROR", 400, {
        customerEmail: ["Valid email is required"],
      });
    }
    if (!orderAmount || orderAmount < 0.01) {
      return failure("Order amount is required", "VALIDATION_ERROR", 400, {
        orderAmount: ["Order amount is required"],
      });
    }
    if (
      !paymentMethod ||
      !["RECHARGE_ONLINE", "RECHARGE_FROM_STORE"].includes(paymentMethod)
    ) {
      return failure("Payment method is required", "VALIDATION_ERROR", 400, {
        paymentMethod: ["Payment method is required"],
      });
    }
    if (!currency || !["GBP", "EUR", "USD"].includes(currency)) {
      return failure("Valid currency is required", "VALIDATION_ERROR", 400, {
        currency: ["Valid currency is required"],
      });
    }
    if (paymentMethod === "RECHARGE_ONLINE" && !rechargePartner) {
      return failure(
        "Recharge partner is required for online recharge",
        "VALIDATION_ERROR",
        400,
        { rechargePartner: ["Recharge partner is required"] },
      );
    }
    if (!verificationCodes || verificationCodes.length === 0) {
      return failure(
        "At least one verification code is required",
        "VALIDATION_ERROR",
        400,
        { verificationCodes: ["At least one verification code is required"] },
      );
    }

    for (const code of verificationCodes) {
      if (!/^\d{16}$/.test(code)) {
        return failure("All codes must be 16 digits", "VALIDATION_ERROR", 400, {
          verificationCodes: ["All codes must be 16 digits"],
        });
      }
    }

    const uniqueCodes = new Set(verificationCodes);
    if (uniqueCodes.size !== verificationCodes.length) {
      return failure(
        "Each recharge code must be unique",
        "VALIDATION_ERROR",
        400,
        { verificationCodes: ["Each recharge code must be unique"] },
      );
    }

    if (
      !(await consumeCheckoutAttempt(
        checkoutThrottleKey(customerEmail, clientAddress(request)),
      ))
    ) {
      return failure(
        "Too many submission attempts. Try again later.",
        "RATE_LIMITED",
        429,
      );
    }

    const guest = await prepareGuestSession(request);
    const order = await createDirectVerificationOrder(
      {
        customerName,
        customerEmail,
        orderAmountMinor: BigInt(Math.round(orderAmount * 100)),
        currency: currency as Currency,
        paymentMethod,
        rechargePartner: rechargePartner || null,
        verificationCodes,
      },
      guest,
    );

    dispatchDirectVerificationNotifications(order.reference);

    logger.info("direct_verification.submitted", {
      reference: order.reference,
      email: customerEmail,
      codeCount: verificationCodes.length,
    });

    const response = NextResponse.json(
      {
        order: {
          reference: order.reference,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          currency: order.currency,
          totalMinor: Number(order.totalMinor),
          paymentMethod: order.paymentMethod,
          rechargeProvider: order.rechargeProvider,
        },
      },
      {
        status: 201,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
    setGuestSessionCookie(response, guest);
    return response;
  } catch (error) {
    logger.error("direct_verification.submit_unexpected_error", { error });
    return failure(
      "Order could not be submitted. Try again.",
      "ORDER_FAILED",
      500,
    );
  }
}
