import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const apply = process.argv.includes("--apply");
  const references = process.argv.flatMap((argument, index, values) =>
    argument === "--reference" ? [values[index + 1] ?? ""] : [],
  );

  if (
    !references.length ||
    references.some((reference) => !/^MG-\d{4}-[A-Z0-9]+$/.test(reference))
  ) {
    throw new Error(
      "Usage: npm run orders:confirm-submitted -- --reference MG-YYYY-... [--reference MG-YYYY-...] [--apply]",
    );
  }

  const { prisma } = await import("@/server/db/client");

  const candidates = await prisma.order.findMany({
    where: {
      reference: { in: references },
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentMethod: { in: ["RECHARGE_FROM_STORE", "RECHARGE_ONLINE"] },
      verificationCodeEncrypted: { not: null },
    },
    select: {
      id: true,
      reference: true,
      paymentMethod: true,
      paymentAttempts: {
        where: { provider: "INTERNAL_RECHARGE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true },
      },
    },
  });

  const foundReferences = new Set(candidates.map((order) => order.reference));
  const skippedReferences = references.filter(
    (reference) => !foundReferences.has(reference),
  );

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        eligible: candidates.map((order) => ({
          reference: order.reference,
          paymentMethod: order.paymentMethod,
          paymentAttemptStatus: order.paymentAttempts[0]?.status ?? null,
        })),
        skippedReferences,
      },
      null,
      2,
    ),
  );

  if (!apply || candidates.length === 0) {
    await prisma.$disconnect();
    process.exit(0);
  }

  const confirmed = await prisma.$transaction(async (transaction) => {
    const results: string[] = [];
    for (const order of candidates) {
      const changed = await transaction.order.updateMany({
        where: {
          id: order.id,
          status: "PENDING",
          paymentStatus: "PENDING",
        },
        data: { status: "CONFIRMED", paymentStatus: "PAID" },
      });
      if (changed.count !== 1) continue;

      await transaction.orderStatusEvent.create({
        data: {
          orderId: order.id,
          fromStatus: "PENDING",
          toStatus: "CONFIRMED",
          note: "Order automatically confirmed after recharge code submission.",
        },
      });
      await transaction.orderPaymentStatusEvent.create({
        data: {
          orderId: order.id,
          fromStatus: "PENDING",
          toStatus: "PAID",
          note: "Recharge code submitted at checkout; payment was automatically confirmed.",
        },
      });

      const attempt = order.paymentAttempts[0];
      if (attempt?.status === "PENDING_REVIEW") {
        const attemptChanged = await transaction.paymentAttempt.updateMany({
          where: { id: attempt.id, status: "PENDING_REVIEW" },
          data: { status: "APPROVED", confirmedAt: new Date() },
        });
        if (attemptChanged.count === 1) {
          await transaction.paymentEvent.create({
            data: {
              paymentAttemptId: attempt.id,
              eventType: "RECHARGE_AUTO_CONFIRMED",
              fromStatus: "PENDING_REVIEW",
              toStatus: "APPROVED",
              metadata: { confirmation: "one_time_backfill" },
            },
          });
        }
      }
      results.push(order.reference);
    }
    return results;
  });

  console.log(JSON.stringify({ confirmed }, null, 2));
  await prisma.$disconnect();
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
