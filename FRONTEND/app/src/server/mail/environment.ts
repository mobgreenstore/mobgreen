import "server-only";

import { z } from "zod";

const notificationEnvironmentSchema = z.object({
  ORDER_NOTIFICATION_TO: z.email().trim().toLowerCase(),
  ORDER_NOTIFICATION_FROM: z.email().trim().toLowerCase(),
});

const smtpEnvironmentSchema = z.object({
  SMTP_HOST: z.string().trim().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65_535),
  SMTP_SECURE: z.enum(["true", "false"]).transform((value) => value === "true"),
  SMTP_USER: z.email().trim().toLowerCase(),
  SMTP_APP_PASSWORD: z.string().min(8),
});

const mailEnvironmentSchema = notificationEnvironmentSchema.extend(
  smtpEnvironmentSchema.shape,
);

const resendEnvironmentSchema = z.object({
  RESEND_API_KEY: z.string().trim().min(8),
});

export type MailEnvironment = z.output<typeof mailEnvironmentSchema>;
export type NotificationEnvironment = z.output<
  typeof notificationEnvironmentSchema
>;

export function getNotificationEnvironment(): NotificationEnvironment {
  return notificationEnvironmentSchema.parse({
    ORDER_NOTIFICATION_TO: process.env.ORDER_NOTIFICATION_TO,
    ORDER_NOTIFICATION_FROM: process.env.ORDER_NOTIFICATION_FROM,
  });
}

export function getMailEnvironment(): MailEnvironment {
  return mailEnvironmentSchema.parse({
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_APP_PASSWORD: process.env.SMTP_APP_PASSWORD,
    ORDER_NOTIFICATION_TO: process.env.ORDER_NOTIFICATION_TO,
    ORDER_NOTIFICATION_FROM: process.env.ORDER_NOTIFICATION_FROM,
  });
}

export function getResendEnvironment() {
  return resendEnvironmentSchema.parse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  });
}

export function resendEnvironmentConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function smtpEnvironmentConfigured() {
  return [
    process.env.SMTP_HOST,
    process.env.SMTP_PORT,
    process.env.SMTP_SECURE,
    process.env.SMTP_USER,
    process.env.SMTP_APP_PASSWORD,
  ].every((value) => Boolean(value?.trim()));
}

export function mailEnvironmentConfigured() {
  const notificationConfigured = [
    process.env.ORDER_NOTIFICATION_TO,
    process.env.ORDER_NOTIFICATION_FROM,
  ].every((value) => Boolean(value?.trim()));
  return (
    notificationConfigured &&
    (resendEnvironmentConfigured() || smtpEnvironmentConfigured())
  );
}
