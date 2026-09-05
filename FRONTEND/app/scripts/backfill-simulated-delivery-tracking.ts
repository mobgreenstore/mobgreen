import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { prisma } = await import("@/server/db/client");
  const { createSelectedCourierSimulation, trackingCreateData } =
    await import("@/features/tracking/server/service");

  const candidates = await prisma.order.findMany({
    where: {
      archivedAt: null,
      fulfillmentType: "DELIVERY",
      paymentStatus: "PAID",
      status: { in: ["CONFIRMED", "PROCESSING", "OUT_FOR_DELIVERY"] },
      deliveryTracking: { is: null },
      destinationLatitude: { not: null },
      destinationLongitude: { not: null },
      courierProfileIdSnapshot: { not: null },
      courierDistanceMeters: { not: null },
      courierDurationSeconds: { not: null },
    },
    select: {
      id: true,
      reference: true,
      status: true,
      destinationLatitude: true,
      destinationLongitude: true,
      courierProfileIdSnapshot: true,
      courierDistanceMeters: true,
      courierDurationSeconds: true,
    },
  });

  let created = 0;
  for (const order of candidates) {
    if (
      order.destinationLatitude === null ||
      order.destinationLongitude === null ||
      !order.courierProfileIdSnapshot ||
      order.courierDistanceMeters === null ||
      order.courierDurationSeconds === null
    ) {
      continue;
    }
    const plan = createSelectedCourierSimulation({
      destination: [
        Number(order.destinationLongitude),
        Number(order.destinationLatitude),
      ],
      distanceMeters: order.courierDistanceMeters,
      durationSeconds: order.courierDurationSeconds,
      seed: `${order.reference}:${order.courierProfileIdSnapshot}`,
    });
    await prisma.$transaction(async (transaction) => {
      const current = await transaction.order.findUnique({
        where: { id: order.id },
        select: { status: true, deliveryTracking: { select: { id: true } } },
      });
      if (!current || current.deliveryTracking) return;
      await transaction.deliveryTracking.create({
        data: trackingCreateData(order.id, plan),
      });
      if (current.status !== "OUT_FOR_DELIVERY") {
        await transaction.order.update({
          where: { id: order.id },
          data: {
            status: "OUT_FOR_DELIVERY",
            statusEvents: {
              create: {
                fromStatus: current.status,
                toStatus: "OUT_FOR_DELIVERY",
                note: "Selected courier simulation started automatically.",
              },
            },
          },
        });
      }
      created += 1;
    });
  }
  await prisma.$disconnect();
  process.stdout.write(`Created ${created} simulated delivery route(s).\n`);
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Tracking backfill failed.";
  process.stderr.write(`Tracking backfill failed: ${message}\n`);
  process.exitCode = 1;
});
