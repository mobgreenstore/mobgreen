import "server-only";

import { z } from "zod";

const mailEnvironmentSchema = z.object({
  SMTP_HOST: z.string().trim().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65_535),
  SMTP_SECURE: z.enum(["true", "false"]).transform((value) => value === "true"),
  SMTP_USER: z.email().trim().toLowerCase(),
  SMTP_APP_PASSWORD: z.string().min(8),
  ORDER_NOTIFICATION_TO: z.email().trim().toLowerCase(),
  ORDER_NOTIFICATION_FROM: z.email().trim().toLowerCase(),
});

export type MailEnvironment = z.output<typeof mailEnvironmentSchema>;

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

export function mailEnvironmentConfigured() {
  return [
    process.env.SMTP_HOST,
    process.env.SMTP_PORT,
    process.env.SMTP_SECURE,
    process.env.SMTP_USER,
    process.env.SMTP_APP_PASSWORD,
    process.env.ORDER_NOTIFICATION_TO,
    process.env.ORDER_NOTIFICATION_FROM,
  ].every((value) => Boolean(value?.trim()));
}
