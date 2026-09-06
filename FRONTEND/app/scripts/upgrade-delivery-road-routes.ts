import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { prisma } = await import("@/server/db/client");
  const { ensureRoadFollowingRouteForOrder } =
    await import("@/features/tracking/server/service");

  const orders = await prisma.order.findMany({
    where: {
      archivedAt: null,
      fulfillmentType: "DELIVERY",
      paymentStatus: "PAID",
      deliveryTracking: {
        is: {
          routeKind: "DIRECT_FALLBACK",
          routeProviderId: { startsWith: "mob-greens-courier-simulation-v1" },
        },
      },
    },
    select: { id: true },
  });

  let upgraded = 0;
  for (const order of orders) {
    if (await ensureRoadFollowingRouteForOrder(order.id)) upgraded += 1;
  }

  await prisma.$disconnect();
  process.stdout.write(
    `Upgraded ${upgraded} of ${orders.length} delivery route(s) to road geometry.\n`,
  );
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Road-route upgrade failed.";
  process.stderr.write(`Road-route upgrade failed: ${message}\n`);
  process.exitCode = 1;
});
