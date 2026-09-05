import "server-only";

import { lookup } from "node:dns/promises";
import net from "node:net";
import tls from "node:tls";
import nodemailer, { type Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import {
  getMailEnvironment,
  getResendEnvironment,
  resendEnvironmentConfigured,
} from "@/server/mail/environment";

let transporter: Transporter | undefined;

type GetSocket = NonNullable<SMTPTransport.Options["getSocket"]>;

function ipv4Socket(
  environment: ReturnType<typeof getMailEnvironment>,
  callback: Parameters<GetSocket>[1],
) {
  let settled = false;
  const settle = (error: Error | null, socket?: net.Socket) => {
    if (settled) return;
    settled = true;
    socket?.removeAllListeners("error");
    socket?.setTimeout(0);
    callback(
      error,
      error
        ? {}
        : {
            connection: socket,
            ...(environment.SMTP_SECURE ? { secured: true } : {}),
          },
    );
  };
  void lookup(environment.SMTP_HOST, { family: 4 })
    .then(({ address }) => {
      const socket = environment.SMTP_SECURE
        ? tls.connect({
            host: address,
            port: environment.SMTP_PORT,
            servername: environment.SMTP_HOST,
          })
        : net.connect({ host: address, port: environment.SMTP_PORT });
      const connectedEvent = environment.SMTP_SECURE
        ? "secureConnect"
        : "connect";
      socket.setTimeout(10_000, () => {
        settle(new Error("SMTP connection timed out."), socket);
        socket.destroy();
      });
      socket.once("error", (error) => settle(error, socket));
      socket.once(connectedEvent, () => settle(null, socket));
    })
    .catch((error: unknown) =>
      settle(error instanceof Error ? error : new Error("SMTP DNS failed.")),
    );
}

export function getMailTransport(): Transporter {
  if (transporter) return transporter;
  const environment = getMailEnvironment();
  transporter = nodemailer.createTransport({
    host: environment.SMTP_HOST,
    port: environment.SMTP_PORT,
    secure: environment.SMTP_SECURE,
    getSocket: (
      _options: SMTPTransport.Options,
      callback: Parameters<GetSocket>[1],
    ) => ipv4Socket(environment, callback),
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

export type MailMessage = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
};

async function sendWithResend(message: MailMessage, idempotencyKey?: string) {
  const { RESEND_API_KEY } = getResendEnvironment();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "mob-greens/1.0",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify(message),
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as {
    id?: string;
  } | null;
  if (!response.ok || !payload?.id) {
    throw new Error(`Email API request failed (${response.status}).`);
  }
  return { messageId: payload.id };
}

export async function sendMail(
  message: MailMessage,
  options: { idempotencyKey?: string } = {},
) {
  if (resendEnvironmentConfigured()) {
    return sendWithResend(message, options.idempotencyKey);
  }
  return getMailTransport().sendMail(message);
}

export async function verifyMailTransport() {
  if (resendEnvironmentConfigured()) {
    getResendEnvironment();
    return { ok: true as const, provider: "resend" as const };
  }
  await getMailTransport().verify();
  return { ok: true as const, provider: "smtp" as const };
}
