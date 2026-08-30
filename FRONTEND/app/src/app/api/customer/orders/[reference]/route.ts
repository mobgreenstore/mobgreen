import type { NextRequest } from "next/server";
import { getGuestOrder } from "@/features/customer-orders/server/queries";
import { logger } from "@/server/core/logger";
import { requireGuestSession } from "@/server/guest-session";
import {
  consumePublicRequest,
  publicThrottleKey,
} from "@/server/public-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "cache-control": "private, no-store, max-age=0" };

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ reference: string }> },
) {
  try {
    const guest = await requireGuestSession(request);
    if (!guest)
      return Response.json({ error: "Not found." }, { status: 404, headers });
    const allowed = await consumePublicRequest(
      "CUSTOMER_ORDERS",
      publicThrottleKey(guest.tokenHash),
      { max: 120, windowMs: 60 * 60 * 1000 },
    );
    if (!allowed) {
      return Response.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers },
      );
    }
    const { reference } = await context.params;
    const order = await getGuestOrder(guest.id, reference);
    if (!order)
      return Response.json({ error: "Not found." }, { status: 404, headers });
    return Response.json({ order }, { headers });
  } catch (error) {
    logger.error("customer_order.read_failed", { error });
    return Response.json(
      { error: "Order could not be loaded." },
      { status: 500, headers },
    );
  }
}
