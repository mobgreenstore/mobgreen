import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { getSessionSecret } from "@/server/auth/environment";
import { prisma } from "@/server/db/client";

export const GUEST_SESSION_COOKIE = "mg_guest_session";
export const GUEST_SESSION_TTL_SECONDS = 60 * 60 * 24 * 90;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export interface GuestSessionIdentity {
  token: string;
  tokenHash: string;
  expiresAt: Date;
  existing: boolean;
}

export function hashGuestSessionToken(token: string) {
  return createHmac("sha256", getSessionSecret()).update(token).digest("hex");
}

function newIdentity(): GuestSessionIdentity {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: hashGuestSessionToken(token),
    expiresAt: new Date(Date.now() + GUEST_SESSION_TTL_SECONDS * 1000),
    existing: false,
  };
}

export async function prepareGuestSession(
  request: NextRequest,
): Promise<GuestSessionIdentity> {
  const token = request.cookies.get(GUEST_SESSION_COOKIE)?.value;
  if (!token || !TOKEN_PATTERN.test(token)) return newIdentity();
  const tokenHash = hashGuestSessionToken(token);
  const existing = await prisma.guestSession.findUnique({
    where: { tokenHash },
    select: { expiresAt: true },
  });
  if (!existing || existing.expiresAt <= new Date()) return newIdentity();
  return { token, tokenHash, expiresAt: existing.expiresAt, existing: true };
}

export async function requireGuestSession(request: NextRequest) {
  const token = request.cookies.get(GUEST_SESSION_COOKIE)?.value;
  if (!token || !TOKEN_PATTERN.test(token)) return null;
  const tokenHash = hashGuestSessionToken(token);
  const session = await prisma.guestSession.findUnique({
    where: { tokenHash },
    select: { id: true, expiresAt: true },
  });
  if (!session || session.expiresAt <= new Date()) return null;
  return { id: session.id, tokenHash };
}

export async function getServerGuestSession() {
  const token = (await cookies()).get(GUEST_SESSION_COOKIE)?.value;
  if (!token || !TOKEN_PATTERN.test(token)) return null;
  const tokenHash = hashGuestSessionToken(token);
  const session = await prisma.guestSession.findUnique({
    where: { tokenHash },
    select: { id: true, expiresAt: true },
  });
  if (!session || session.expiresAt <= new Date()) return null;
  return { id: session.id, tokenHash };
}

export function setGuestSessionCookie(
  response: NextResponse,
  identity: GuestSessionIdentity,
) {
  response.cookies.set(GUEST_SESSION_COOKIE, identity.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_SESSION_TTL_SECONDS,
    priority: "high",
  });
}
