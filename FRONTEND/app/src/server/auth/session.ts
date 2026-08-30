import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import {
  getIronSession,
  type IronSession,
  type SessionOptions,
} from "iron-session";
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
  getAdminSessionCookieOptions,
  LEGACY_ADMIN_SESSION_PATH,
} from "@/config/admin-session";
import type { AdminRole } from "@/types/admin";
import { prisma } from "@/server/db/client";
import { getSessionSecret } from "@/server/auth/environment";

export interface AdminSessionData {
  adminId?: string;
  sessionVersion?: number;
}

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export const adminSessionOptions: SessionOptions = {
  cookieName: ADMIN_SESSION_COOKIE_NAME,
  password: getSessionSecret(),
  ttl: ADMIN_SESSION_TTL_SECONDS,
  cookieOptions: getAdminSessionCookieOptions(),
};

const getCookieSession = getIronSession as unknown as (
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  options: SessionOptions,
) => Promise<IronSession<AdminSessionData>>;

export async function getAdminSession() {
  return getCookieSession(await cookies(), adminSessionOptions);
}

export async function createAdminSession(
  adminId: string,
  sessionVersion: number,
) {
  const session = await getAdminSession();
  session.adminId = adminId;
  session.sessionVersion = sessionVersion;
  await session.save();
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const session = await getCookieSession(cookieStore, adminSessionOptions);
  session.destroy();
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, "", {
    ...getAdminSessionCookieOptions(),
    path: LEGACY_ADMIN_SESSION_PATH,
    expires: new Date(0),
    maxAge: 0,
  });
}

export const getAuthenticatedAdmin = cache(
  async function getAuthenticatedAdmin(): Promise<AuthenticatedAdmin | null> {
    const session = await getAdminSession();
    if (!session.adminId || session.sessionVersion === undefined) return null;

    const admin = await prisma.adminUser.findUnique({
      where: { id: session.adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        sessionVersion: true,
      },
    });

    if (!admin?.isActive || admin.sessionVersion !== session.sessionVersion) {
      return null;
    }

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };
  },
);

export async function requireAuthenticatedAdmin() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
