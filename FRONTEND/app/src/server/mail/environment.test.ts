import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const original = { ...process.env };

afterEach(() => {
  process.env = { ...original };
});

describe("mail environment", () => {
  it("accepts a complete server-only Gmail SMTP configuration", async () => {
    Object.assign(process.env, {
      SMTP_HOST: "smtp.gmail.com",
      SMTP_PORT: "465",
      SMTP_SECURE: "true",
      SMTP_USER: "sender@example.com",
      SMTP_APP_PASSWORD: "app-password-value",
      ORDER_NOTIFICATION_TO: "admin@example.com",
      ORDER_NOTIFICATION_FROM: "sender@example.com",
    });
    const { getMailEnvironment, mailEnvironmentConfigured } =
      await import("@/server/mail/environment");
    expect(mailEnvironmentConfigured()).toBe(true);
    expect(getMailEnvironment()).toMatchObject({
      SMTP_PORT: 465,
      SMTP_SECURE: true,
      SMTP_USER: "sender@example.com",
      ORDER_NOTIFICATION_TO: "admin@example.com",
    });
  });

  it("requires SMTP even when an unrelated mail API key exists", async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_APP_PASSWORD;
    Object.assign(process.env, {
      RESEND_API_KEY: "re_test_sending_access_key",
      ORDER_NOTIFICATION_TO: "admin@example.com",
      ORDER_NOTIFICATION_FROM: "sender@example.com",
    });
    const { getNotificationEnvironment, mailEnvironmentConfigured } =
      await import("@/server/mail/environment");
    expect(mailEnvironmentConfigured()).toBe(false);
    expect(getNotificationEnvironment()).toEqual({
      ORDER_NOTIFICATION_TO: "admin@example.com",
      ORDER_NOTIFICATION_FROM: "sender@example.com",
    });
  });

  it("does not treat empty credential placeholders as configured", async () => {
    delete process.env.RESEND_API_KEY;
    process.env.SMTP_APP_PASSWORD = "";
    const { mailEnvironmentConfigured } =
      await import("@/server/mail/environment");
    expect(mailEnvironmentConfigured()).toBe(false);
  });
});
