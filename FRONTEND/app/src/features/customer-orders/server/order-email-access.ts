import "server-only";

import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { getSessionSecret } from "@/server/auth/environment";

export const ORDER_EMAIL_ACCESS_TTL_SECONDS = 60 * 60 * 24 * 90;

const TOKEN_PATTERN = /^(\d{10,11})\.([A-Za-z0-9_-]{43})$/;

export interface OrderEmailAccess {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

function signature(reference: string, expiresAtSeconds: number) {
  return createHmac("sha256", getSessionSecret())
    .update(`mob-greens-order-email-access:v1:${reference}:${expiresAtSeconds}`)
    .digest("base64url");
}

function cookieName(reference: string) {
  const referenceHash = createHash("sha256")
    .update(reference)
    .digest("hex")
    .slice(0, 16);
  return `mg_order_access_${referenceHash}`;
}

function parseAccess(
  reference: string,
  token: string | undefined,
  now = new Date(),
): OrderEmailAccess | null {
  if (!token) return null;
  const match = TOKEN_PATTERN.exec(token);
  if (!match) return null;
  const expiresAtSeconds = Number(match[1]);
  const receivedSignature = match[2];
  if (!receivedSignature) return null;
  if (!Number.isSafeInteger(expiresAtSeconds)) return null;
  const expiresAt = new Date(expiresAtSeconds * 1000);
  if (expiresAt <= now) return null;

  const expected = Buffer.from(signature(reference, expiresAtSeconds));
  const received = Buffer.from(receivedSignature);
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null;
  }
  return {
    token,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    expiresAt,
  };
}

export function createOrderEmailAccessToken(
  reference: string,
  now = new Date(),
) {
  const expiresAtSeconds =
    Math.floor(now.getTime() / 1000) + ORDER_EMAIL_ACCESS_TTL_SECONDS;
  return `${expiresAtSeconds}.${signature(reference, expiresAtSeconds)}`;
}

export function getOrderEmailAccess(
  reference: string,
  token: string | undefined,
) {
  return parseAccess(reference, token);
}

export async function getServerOrderEmailAccess(reference: string) {
  const token = (await cookies()).get(cookieName(reference))?.value;
  return parseAccess(reference, token);
}

export function getRequestOrderEmailAccess(
  request: NextRequest,
  reference: string,
) {
  return parseAccess(
    reference,
    request.cookies.get(cookieName(reference))?.value,
  );
}

export function setOrderEmailAccessCookie(
  response: NextResponse,
  reference: string,
  access: OrderEmailAccess,
) {
  const maxAge = Math.max(
    1,
    Math.floor((access.expiresAt.getTime() - Date.now()) / 1000),
  );
  response.cookies.set(cookieName(reference), access.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
    priority: "high",
  });
}
