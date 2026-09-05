import { NextRequest, NextResponse } from "next/server";
import {
  getOrderEmailAccess,
  setOrderEmailAccessCookie,
} from "@/features/customer-orders/server/order-email-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = {
  "cache-control": "private, no-store, max-age=0",
  "referrer-policy": "no-referrer",
  "x-robots-tag": "noindex, nofollow, noarchive",
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ reference: string }> },
) {
  const { reference } = await context.params;
  const access = getOrderEmailAccess(
    reference,
    request.nextUrl.searchParams.get("token") ?? undefined,
  );
  if (!access) {
    return new NextResponse("Not found.", { status: 404, headers: privateHeaders });
  }

  const next = request.nextUrl.searchParams.get("next");
  const pathname = `/orders/${encodeURIComponent(reference)}${
    next === "tracking" ? "/tracking" : ""
  }`;
  const response = NextResponse.redirect(new URL(pathname, request.url), 303);
  for (const [name, value] of Object.entries(privateHeaders)) {
    response.headers.set(name, value);
  }
  setOrderEmailAccessCookie(response, reference, access);
  return response;
}
