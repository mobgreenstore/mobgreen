import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/client";

export type TransactionClient = Prisma.TransactionClient;
export type DatabaseClient = typeof prisma | TransactionClient;

export interface TransactionOptions {
  maxWaitMs?: number;
  timeoutMs?: number;
}

export function withTransaction<T>(
  operation: (transaction: TransactionClient) => Promise<T>,
  options: TransactionOptions = {},
): Promise<T> {
  return prisma.$transaction(operation, {
    maxWait: options.maxWaitMs ?? 5_000,
    timeout: options.timeoutMs ?? 10_000,
  });
}
