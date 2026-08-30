import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import { getMailEnvironment } from "@/server/mail/environment";

let transporter: Transporter | undefined;

export function getMailTransport(): Transporter {
  if (transporter) return transporter;
  const environment = getMailEnvironment();
  transporter = nodemailer.createTransport({
    host: environment.SMTP_HOST,
    port: environment.SMTP_PORT,
    secure: environment.SMTP_SECURE,
    auth: {
      user: environment.SMTP_USER,
      pass: environment.SMTP_APP_PASSWORD,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

export async function verifyMailTransport() {
  await getMailTransport().verify();
  return { ok: true as const };
}
