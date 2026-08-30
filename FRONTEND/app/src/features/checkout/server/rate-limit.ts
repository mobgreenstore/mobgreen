import "server-only";

import { createHmac } from "node:crypto";
import { getSessionSecret } from "@/server/auth/environment";
import { withTransaction } from "@/server/db/transaction";

const WINDOW_MS = 60 * 60 * 1000;
const BLOCK_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 10;

export function checkoutThrottleKey(email: string, address: string) {
  return createHmac("sha256", getSessionSecret())
    .update(`${email.trim().toLowerCase()}\0${address}`)
    .digest("hex");
}

export async function consumeCheckoutAttempt(
  keyHash: string,
  now = new Date(),
) {
  return withTransaction(async (transaction) => {
    const current = await transaction.checkoutThrottle.findUnique({
      where: { keyHash },
    });
    if (current?.blockedUntil && current.blockedUntil > now) return false;

    const inWindow =
      current && now.getTime() - current.windowStartedAt.getTime() < WINDOW_MS;
    const requestCount = inWindow ? current.requestCount + 1 : 1;
    const windowStartedAt = inWindow ? current.windowStartedAt : now;
    const blockedUntil =
      requestCount > MAX_REQUESTS ? new Date(now.getTime() + BLOCK_MS) : null;

    await transaction.checkoutThrottle.upsert({
      where: { keyHash },
      create: { keyHash, requestCount, windowStartedAt, blockedUntil },
      update: { requestCount, windowStartedAt, blockedUntil },
    });
    return blockedUntil === null;
  });
}
