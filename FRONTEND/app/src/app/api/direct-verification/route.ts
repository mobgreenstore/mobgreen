import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import type { Currency, OrderStatus, PaymentStatus } from "@/generated/prisma/client";
import {
  encryptVerificationCode,
  fingerprintVerificationCode,
} from "@/features/checkout/server/code-encryption";
import { maskVerificationCode } from "@/features/order-notifications/server/template";
import {
  createCustomerOrderNotificationEnvelope,
  createOrderNotificationEnvelope,
  dispatchCustomerOrderSubmittedNotification,
  dispatchOrderSubmittedNotification,
} from "@/features/order-notifications/server/service";
import { prisma } from "@/server/db/client";
import { withTransaction } from "@/server/db/transaction";
import { logger } from "@/server/core/logger";

function createReference() {
  const year = new Date().getUTCFullYear();
  return `MG-${year}-${randomBytes(7).toString("hex").toUpperCase()}`;
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const customerName = body.customerName?.trim();
    const customerEmail = body.customerEmail?.trim()?.toLowerCase();
    const orderAmount = parseFloat(body.orderAmount);
    const paymentMethod = body.paymentMethod;
    const rechargePartner = body.rechargePartner?.trim();
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
    if (!paymentMethod || !["RECHARGE_ONLINE", "RECHARGE_FROM_STORE"].includes(paymentMethod)) {
      return failure("Payment method is required", "VALIDATION_ERROR", 400, {
        paymentMethod: ["Payment method is required"],
      });
    }
    if (paymentMethod === "RECHARGE_ONLINE" && !rechargePartner) {
      return failure("Recharge partner is required for online recharge", "VALIDATION_ERROR", 400, {
        rechargePartner: ["Recharge partner is required"],
      });
    }
    if (!verificationCodes || verificationCodes.length === 0) {
      return failure("At least one verification code is required", "VALIDATION_ERROR", 400, {
        verificationCodes: ["At least one verification code is required"],
      });
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
      return failure("Each recharge code must be unique", "VALIDATION_ERROR", 400, {
        verificationCodes: ["Each recharge code must be unique"],
      });
    }

    const securedCodes = verificationCodes.map((code: string, position: number) => ({
      encryptedValue: encryptVerificationCode(code),
      fingerprint: fingerprintVerificationCode(code),
      maskedValue: maskVerificationCode(code),
      position,
    }));
    const encryptedCode = securedCodes[0]?.encryptedValue ?? null;

    const result = await withTransaction(async (transaction) => {
      const reference = createReference();
      const currency: Currency = "EUR";
      const totalMinor = BigInt(Math.round(orderAmount * 100));
      const status: OrderStatus = "PENDING";
      const paymentStatus: PaymentStatus = "PENDING";

      const order = await transaction.order.create({
        data: {
          reference,
          currency,
          subtotalMinor: totalMinor,
          totalMinor,
          status,
          paymentStatus,
          customerName,
          customerEmail,
          fulfillmentType: "PICKUP",
          paymentMethod,
          rechargeProvider: rechargePartner || null,
          verificationCodeEncrypted: encryptedCode,
        },
      });

      await dispatchOrderSubmittedNotification(reference);
      await dispatchCustomerOrderSubmittedNotification(reference);

      return { reference: order.reference };
    });

    logger.info("direct_verification.submitted", {
      reference: result.reference,
      email: customerEmail,
    });

    return Response.json(
      { order: result },
      {
        status: 201,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (error) {
    logger.error("direct_verification.submit_unexpected_error", { error });
    return failure(
      "Order could not be submitted. Try again.",
      "ORDER_FAILED",
      500,
    );
  }
}
