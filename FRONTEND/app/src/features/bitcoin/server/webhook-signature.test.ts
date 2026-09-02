import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyBtcPayWebhookSignature } from "@/features/bitcoin/server/webhook-signature";

describe("BTCPay webhook signature", () => {
  const secret = "a-secure-webhook-secret-value";
  const body = JSON.stringify({ type: "InvoiceSettled", invoiceId: "inv-1" });

  it("accepts an authentic raw payload", () => {
    const digest = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyBtcPayWebhookSignature(body, `sha256=${digest}`, secret)).toBe(
      true,
    );
  });

  it("rejects altered, malformed, and missing signatures", () => {
    const digest = createHmac("sha256", secret).update(body).digest("hex");
    expect(
      verifyBtcPayWebhookSignature(`${body} `, `sha256=${digest}`, secret),
    ).toBe(false);
    expect(verifyBtcPayWebhookSignature(body, "invalid", secret)).toBe(false);
    expect(verifyBtcPayWebhookSignature(body, null, secret)).toBe(false);
  });
});
