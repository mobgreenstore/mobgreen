import { NextRequest } from "next/server";
import { checkoutIntentIdSchema } from "@/features/delivery-matching/schema";
import { CheckoutIntentService } from "@/features/delivery-matching/server/checkout-intent-service";
import { requireGuestSession } from "@/server/guest-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/checkout/intents/[intentId]">,
) {
  const guest = await requireGuestSession(request);
  if (!guest)
    return Response.json(
      { error: "Checkout not found.", code: "NOT_FOUND" },
      { status: 404, headers: { "Cache-Control": "private, no-store" } },
    );
  const parsed = checkoutIntentIdSchema.safeParse(
    (await context.params).intentId,
  );
  if (!parsed.success)
    return Response.json(
      { error: "Checkout not found.", code: "NOT_FOUND" },
      { status: 404, headers: { "Cache-Control": "private, no-store" } },
    );
  const intent = await new CheckoutIntentService().getForGuest(
    guest.id,
    parsed.data,
  );
  if (!intent)
    return Response.json(
      { error: "Checkout not found.", code: "NOT_FOUND" },
      { status: 404, headers: { "Cache-Control": "private, no-store" } },
    );
  return Response.json(
    { intent },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
