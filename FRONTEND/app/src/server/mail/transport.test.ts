import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/mail/environment", () => ({
  getMailEnvironment: vi.fn(),
  getResendEnvironment: () => ({ RESEND_API_KEY: "re_test_key" }),
  resendEnvironmentConfigured: () => true,
}));

import { sendMail } from "@/server/mail/transport";

describe("HTTP mail transport", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: "resend-message-id" }), {
          status: 200,
        }),
      ),
    );
  });

  it("uses Resend's HTTPS endpoint with an idempotency key", async () => {
    await expect(
      sendMail(
        {
          from: "sender@example.com",
          to: "customer@example.com",
          subject: "Order received",
          text: "Order received",
          html: "<p>Order received</p>",
        },
        { idempotencyKey: "notification-id" },
      ),
    ).resolves.toEqual({ messageId: "resend-message-id" });

    expect(fetch).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer re_test_key",
          "Idempotency-Key": "notification-id",
        }),
      }),
    );
  });
});
