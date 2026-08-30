import "server-only";

import { redirect } from "next/navigation";
import type { AdminRole } from "@/types/admin";
import {
  getAuthenticatedAdmin,
  type AuthenticatedAdmin,
} from "@/server/auth/session";

export const adminPermissions = [
  "workspace.read",
  "catalog.read",
  "catalog.write",
  "orders.read",
  "orders.write",
  "payments.verify",
  "settings.read",
  "settings.write",
  "admins.manage",
] as const;

export type AdminPermission = (typeof adminPermissions)[number];

const rolePermissions: Record<AdminRole, ReadonlySet<AdminPermission>> = {
  OWNER: new Set(adminPermissions),
  MANAGER: new Set([
    "workspace.read",
    "catalog.read",
    "catalog.write",
    "orders.read",
    "orders.write",
    "payments.verify",
    "settings.read",
    "settings.write",
  ]),
  EDITOR: new Set([
    "workspace.read",
    "catalog.read",
    "catalog.write",
    "orders.read",
    "orders.write",
    "settings.read",
  ]),
  VIEWER: new Set([
    "workspace.read",
    "catalog.read",
    "orders.read",
    "settings.read",
  ]),
};

export class AdminAuthorizationError extends Error {
  constructor(public readonly status: 401 | 403) {
    super(status === 401 ? "Authentication required." : "Permission denied.");
    this.name = "AdminAuthorizationError";
  }
}

export function hasAdminPermission(
  role: AdminRole,
  permission: AdminPermission,
) {
  return rolePermissions[role].has(permission);
}

export function authorizeAdminActor(
  admin: AuthenticatedAdmin | null,
  permission: AdminPermission,
) {
  if (!admin) throw new AdminAuthorizationError(401);
  if (!hasAdminPermission(admin.role, permission)) {
    throw new AdminAuthorizationError(403);
  }
  return admin;
}

export async function requireAdminPermission(permission: AdminPermission) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) redirect("/admin/login");
  return authorizeAdminActor(admin, permission);
}

export async function authorizeAdminRoute(permission: AdminPermission) {
  const admin = await getAuthenticatedAdmin();
  try {
    return { ok: true as const, admin: authorizeAdminActor(admin, permission) };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return {
        ok: false as const,
        response: Response.json(
          { error: error.status === 401 ? "Unauthorized" : "Forbidden" },
          { status: error.status },
        ),
      };
    }
    throw error;
  }
}
