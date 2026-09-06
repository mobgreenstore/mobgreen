import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMailThroughSmtp = vi.hoisted(() => vi.fn());
const verifySmtp = vi.hoisted(() => vi.fn());
const createTransport = vi.hoisted(() =>
  vi.fn(() => ({
    sendMail: sendMailThroughSmtp,
    verify: verifySmtp,
  })),
);

vi.mock("nodemailer", () => ({
  default: { createTransport },
}));

vi.mock("@/server/mail/environment", () => ({
  getMailEnvironment: () => ({
    SMTP_HOST: "smtp.gmail.com",
    SMTP_PORT: 465,
    SMTP_SECURE: true,
    SMTP_USER: "sender@example.com",
    SMTP_APP_PASSWORD: "app-password-value",
  }),
}));

import { sendMail, verifyMailTransport } from "@/server/mail/transport";

describe("SMTP mail transport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendMailThroughSmtp.mockResolvedValue({ messageId: "smtp-message-id" });
    verifySmtp.mockResolvedValue(true);
  });

  it("sends every message through the configured SMTP transport", async () => {
    const message = {
      from: "sender@example.com",
      to: "customer@example.com",
      subject: "Order received",
      text: "Order received",
      html: "<p>Order received</p>",
    };

    await expect(sendMail(message)).resolves.toEqual({
      messageId: "smtp-message-id",
    });
    expect(sendMailThroughSmtp).toHaveBeenCalledWith(message);
    expect(createTransport).toHaveBeenCalledOnce();
  });

  it("checks the same SMTP transport used to send mail", async () => {
    await expect(verifyMailTransport()).resolves.toEqual({
      ok: true,
      provider: "smtp",
    });
    expect(verifySmtp).toHaveBeenCalledOnce();
  });
});
