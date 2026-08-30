import "server-only";

import { createHmac } from "node:crypto";
import { prisma } from "@/server/db/client";
import { getSessionSecret } from "@/server/auth/environment";
import { withTransaction } from "@/server/db/transaction";

const WINDOW_MS = 15 * 60 * 1_000;
const LOCK_MS = 15 * 60 * 1_000;
const MAX_FAILURES = 5;

export function createLoginThrottleKey(email: string, clientAddress: string) {
  return createHmac("sha256", getSessionSecret())
    .update(`${email.trim().toLowerCase()}\u0000${clientAddress}`)
    .digest("hex");
}

export async function isLoginRateLimited(keyHash: string, now = new Date()) {
  const throttle = await prisma.adminLoginThrottle.findUnique({
    where: { keyHash },
  });
  return Boolean(throttle?.lockedUntil && throttle.lockedUntil > now);
}

export async function recordLoginFailure(keyHash: string, now = new Date()) {
  await withTransaction(async (transaction) => {
    const current = await transaction.adminLoginThrottle.findUnique({
      where: { keyHash },
    });
    const inCurrentWindow =
      current && now.getTime() - current.windowStartedAt.getTime() < WINDOW_MS;
    const failedAttempts = inCurrentWindow ? current.failedAttempts + 1 : 1;
    const windowStartedAt = inCurrentWindow ? current.windowStartedAt : now;
    const lockedUntil =
      failedAttempts >= MAX_FAILURES ? new Date(now.getTime() + LOCK_MS) : null;

    await transaction.adminLoginThrottle.upsert({
      where: { keyHash },
      create: { keyHash, failedAttempts, windowStartedAt, lockedUntil },
      update: { failedAttempts, windowStartedAt, lockedUntil },
    });
  });
}

export async function clearLoginFailures(keyHash: string) {
  await prisma.adminLoginThrottle.deleteMany({ where: { keyHash } });
}
