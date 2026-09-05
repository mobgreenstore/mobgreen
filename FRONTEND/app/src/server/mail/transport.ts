import "server-only";

import { lookup } from "node:dns/promises";
import net from "node:net";
import tls from "node:tls";
import nodemailer, { type Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { getMailEnvironment } from "@/server/mail/environment";

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

export async function verifyMailTransport() {
  await getMailTransport().verify();
  return { ok: true as const };
}
