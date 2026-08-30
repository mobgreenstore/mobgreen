import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { getMailEnvironment } = await import("@/server/mail/environment");
  const { verifyMailTransport } = await import("@/server/mail/transport");
  const environment = getMailEnvironment();
  await verifyMailTransport();
  process.stdout.write(
    `SMTP connection verified for ${environment.SMTP_USER} -> ${environment.ORDER_NOTIFICATION_TO}\n`,
  );
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "SMTP verification failed.";
  process.stderr.write(`SMTP health check failed: ${message}\n`);
  process.exitCode = 1;
});
