import type { AuthenticatedAdmin } from "@/server/auth/session";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/session", () => ({
  getAuthenticatedAdmin: vi.fn(),
}));

const { authorizeAdminActor, hasAdminPermission } =
  await import("@/server/auth/authorization");

const viewer: AuthenticatedAdmin = {
  id: "124bf462-6765-451c-8db8-d47976ec9595",
  email: "viewer@mobgreens.com",
  name: "Read only administrator",
  role: "VIEWER",
};

describe("admin RBAC", () => {
  it("rejects unauthenticated reads", () => {
    expect(() => authorizeAdminActor(null, "orders.read")).toThrow(
      expect.objectContaining({ status: 401 }),
    );
  });

  it("rejects unauthorized writes", () => {
    expect(() => authorizeAdminActor(viewer, "catalog.write")).toThrow(
      expect.objectContaining({ status: 403 }),
    );
  });

  it("allows role-appropriate reads and owner-only administration", () => {
    expect(authorizeAdminActor(viewer, "catalog.read")).toBe(viewer);
    expect(hasAdminPermission("OWNER", "admins.manage")).toBe(true);
    expect(hasAdminPermission("MANAGER", "admins.manage")).toBe(false);
  });

  it("limits recharge verification to owner and manager roles", () => {
    expect(hasAdminPermission("OWNER", "payments.verify")).toBe(true);
    expect(hasAdminPermission("MANAGER", "payments.verify")).toBe(true);
    expect(hasAdminPermission("EDITOR", "payments.verify")).toBe(false);
    expect(hasAdminPermission("VIEWER", "payments.verify")).toBe(false);
  });
});
