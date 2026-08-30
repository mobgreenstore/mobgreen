import { prisma } from "@/server/db/client";

export interface DatabaseHealth {
  ok: boolean;
  latencyMs: number;
  checkedAt: string;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const startedAt = performance.now();
  await prisma.$queryRaw`SELECT 1`;

  return {
    ok: true,
    latencyMs: Math.round(performance.now() - startedAt),
    checkedAt: new Date().toISOString(),
  };
}
