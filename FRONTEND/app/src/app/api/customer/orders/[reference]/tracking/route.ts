import type { NextRequest } from "next/server";
import { getRequestOrderEmailAccess } from "@/features/customer-orders/server/order-email-access";
import {
  getEmailAccessibleTracking,
  getGuestTracking,
} from "@/features/customer-orders/server/queries";
import { logger } from "@/server/core/logger";
import { requireGuestSession } from "@/server/guest-session";
import {
  consumePublicRequest,
  publicThrottleKey,
} from "@/server/public-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = {
  "cache-control": "private, no-store, max-age=0",
  "referrer-policy": "no-referrer",
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ reference: string }> },
) {
  try {
    const guest = await requireGuestSession(request);
    const { reference } = await context.params;
    const emailAccess = getRequestOrderEmailAccess(request, reference);
    if (!guest && !emailAccess)
      return Response.json({ error: "Not found." }, { status: 404, headers });
    const allowed = await consumePublicRequest(
      "CUSTOMER_ORDERS",
      publicThrottleKey(guest?.tokenHash ?? emailAccess!.tokenHash),
      { max: 120, windowMs: 60 * 60 * 1000 },
    );
    if (!allowed) {
      return Response.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers },
      );
    }
    let tracking = guest ? await getGuestTracking(guest.id, reference) : null;
    if (!tracking && emailAccess) {
      tracking = await getEmailAccessibleTracking(reference);
    }
    if (!tracking)
      return Response.json({ error: "Not found." }, { status: 404, headers });
    return Response.json({ tracking }, { headers });
  } catch (error) {
    logger.error("customer_order.tracking_failed", { error });
    return Response.json(
      { error: "Tracking could not be loaded." },
      { status: 500, headers },
    );
  }
}
