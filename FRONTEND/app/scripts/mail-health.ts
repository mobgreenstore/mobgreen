import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { getNotificationEnvironment } =
    await import("@/server/mail/environment");
  const { verifyMailTransport } = await import("@/server/mail/transport");
  const environment = getNotificationEnvironment();
  const result = await verifyMailTransport();
  process.stdout.write(
    result.provider === "smtp"
      ? `SMTP connection verified for ${environment.ORDER_NOTIFICATION_TO}\n`
      : `Resend HTTPS mail configuration is ready for ${environment.ORDER_NOTIFICATION_TO}\n`,
  );
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Mail verification failed.";
  process.stderr.write(`Mail health check failed: ${message}\n`);
  process.exitCode = 1;
});
