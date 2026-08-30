import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const [{ checkDatabaseHealth }, { prisma }] = await Promise.all([
    import("../src/server/db/health"),
    import("../src/server/db/client"),
  ]);

  try {
    const health = await checkDatabaseHealth();
    console.log(
      `Database healthy (${health.latencyMs} ms) at ${health.checkedAt}`,
    );
  } catch (error) {
    console.error("Database health check failed.");
    if (process.env.NODE_ENV !== "production") console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
