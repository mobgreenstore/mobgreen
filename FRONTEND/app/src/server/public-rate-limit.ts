import "server-only";

import { createHmac } from "node:crypto";
import { getSessionSecret } from "@/server/auth/environment";
import { withTransaction } from "@/server/db/transaction";

export function publicThrottleKey(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

export async function consumePublicRequest(
  scope: "GEOCODING" | "CUSTOMER_ORDERS",
  keyHash: string,
  options: { max: number; windowMs: number },
  now = new Date(),
) {
  return withTransaction(async (transaction) => {
    const current = await transaction.publicRequestThrottle.findUnique({
      where: { scope_keyHash: { scope, keyHash } },
    });
    const inWindow =
      current &&
      now.getTime() - current.windowStartedAt.getTime() < options.windowMs;
    const count = inWindow ? current.requestCount + 1 : 1;
    const windowStartedAt = inWindow ? current.windowStartedAt : now;
    await transaction.publicRequestThrottle.upsert({
      where: { scope_keyHash: { scope, keyHash } },
      create: { scope, keyHash, requestCount: count, windowStartedAt },
      update: { requestCount: count, windowStartedAt },
    });
    return count <= options.max;
  });
}
