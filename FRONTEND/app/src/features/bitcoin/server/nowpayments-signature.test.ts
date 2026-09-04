import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyNowPaymentsWebhookSignature } from "@/features/bitcoin/server/nowpayments-signature";

describe("NOWPayments IPN signature", () => {
  const secret = "a-secure-webhook-secret-value";
  const body = JSON.stringify({ payment_status: "finished", payment_id: 1 });
  it("accepts an authentic canonical HMAC-SHA512 payload", () => {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    const sorted = JSON.stringify(
      Object.fromEntries(
        Object.entries(parsed).sort(([a], [b]) => a.localeCompare(b)),
      ),
    );
    const digest = createHmac("sha512", secret).update(sorted).digest("hex");
    expect(verifyNowPaymentsWebhookSignature(body, digest, secret)).toBe(true);
  });
  it("rejects altered or malformed signatures", () => {
    expect(
      verifyNowPaymentsWebhookSignature(`${body} `, "a".repeat(128), secret),
    ).toBe(false);
    expect(verifyNowPaymentsWebhookSignature(body, "invalid", secret)).toBe(
      false,
    );
    expect(verifyNowPaymentsWebhookSignature(body, null, secret)).toBe(false);
  });
});
