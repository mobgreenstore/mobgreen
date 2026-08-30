import type { NextRequest } from "next/server";
import type { CustomerOrderTab } from "@/features/customer-orders/types";
import { listGuestOrders } from "@/features/customer-orders/server/queries";
import { logger } from "@/server/core/logger";
import { requireGuestSession } from "@/server/guest-session";
import {
  consumePublicRequest,
  publicThrottleKey,
} from "@/server/public-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = {
  "cache-control": "private, no-store, max-age=0",
  pragma: "no-cache",
};

export async function GET(request: NextRequest) {
  try {
    const guest = await requireGuestSession(request);
    if (!guest) {
      return Response.json(
        { orders: [], page: 1, pageCount: 1, total: 0, tab: "active" },
        { headers: privateHeaders },
      );
    }
    const allowed = await consumePublicRequest(
      "CUSTOMER_ORDERS",
      publicThrottleKey(guest.tokenHash),
      { max: 120, windowMs: 60 * 60 * 1000 },
    );
    if (!allowed) {
      return Response.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: privateHeaders },
      );
    }
    const searchParams = new URL(request.url).searchParams;
    const page = Number(searchParams.get("page") ?? "1");
    const requestedTab = searchParams.get("tab");
    const tab: CustomerOrderTab = [
      "active",
      "completed",
      "cancelled",
      "pending",
    ].includes(requestedTab ?? "")
      ? (requestedTab as CustomerOrderTab)
      : "active";
    const result = await listGuestOrders(
      guest.id,
      Number.isSafeInteger(page) ? page : 1,
      tab,
    );
    return Response.json(result, { headers: privateHeaders });
  } catch (error) {
    logger.error("customer_orders.list_failed", { error });
    return Response.json(
      { error: "Orders could not be loaded." },
      { status: 500, headers: privateHeaders },
    );
  }
}
