import type { AdminUser } from "@/generated/prisma/client";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminUserRepository } from "@/server/repositories/contracts";
import { hashPassword } from "@/server/auth/password";

const rateLimit = vi.hoisted(() => ({
  createLoginThrottleKey: vi.fn(() => "throttle-key"),
  isLoginRateLimited: vi.fn(async () => false),
  recordLoginFailure: vi.fn(async () => undefined),
  clearLoginFailures: vi.fn(async () => undefined),
}));

vi.mock("@/server/auth/rate-limit", () => rateLimit);
vi.mock("@/server/repositories/prisma", () => ({
  PrismaAdminUserRepository: class {},
}));

const { AdminAuthenticationService, GENERIC_AUTH_ERROR } =
  await import("@/server/auth/authenticate");

let passwordHash: string;
const now = new Date("2026-01-01T00:00:00.000Z");

beforeAll(async () => {
  passwordHash = await hashPassword("correct-long-password");
});

beforeEach(() => {
  rateLimit.isLoginRateLimited.mockResolvedValue(false);
});

function admin(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: "124bf462-6765-451c-8db8-d47976ec9595",
    email: "admin@mobgreens.com",
    passwordHash,
    name: "Store administrator",
    isActive: true,
    role: "OWNER",
    sessionVersion: 1,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function repository(user: AdminUser | null): AdminUserRepository {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn().mockResolvedValue(user),
    create: vi.fn(),
    setActive: vi.fn(),
    recordSuccessfulLogin: vi.fn().mockResolvedValue(user),
  };
}

describe("AdminAuthenticationService", () => {
  it("returns the same generic error for an unknown email", async () => {
    const service = new AdminAuthenticationService(repository(null));
    const result = await service.authenticate(
      { email: "unknown@mobgreens.com", password: "wrong-password" },
      "127.0.0.1",
    );
    expect(result).toEqual({
      ok: false,
      error: { code: "UNAUTHORIZED", message: GENERIC_AUTH_ERROR },
    });
    expect(rateLimit.recordLoginFailure).toHaveBeenCalled();
  });

  it("returns the same generic error while throttled", async () => {
    rateLimit.isLoginRateLimited.mockResolvedValue(true);
    const storage = repository(admin());
    const result = await new AdminAuthenticationService(storage).authenticate(
      { email: "admin@mobgreens.com", password: "correct-long-password" },
      "127.0.0.1",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe(GENERIC_AUTH_ERROR);
    expect(storage.findByEmail).not.toHaveBeenCalled();
  });

  it("returns session-safe identity data after valid credentials", async () => {
    const storage = repository(admin());
    const result = await new AdminAuthenticationService(storage).authenticate(
      { email: "ADMIN@MOBGREENS.COM", password: "correct-long-password" },
      "127.0.0.1",
    );
    expect(result).toEqual({
      ok: true,
      value: {
        adminId: "124bf462-6765-451c-8db8-d47976ec9595",
        sessionVersion: 1,
      },
    });
    expect(rateLimit.clearLoginFailures).toHaveBeenCalledWith("throttle-key");
  });
});
