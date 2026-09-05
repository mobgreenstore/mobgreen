import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/environment", () => ({
  getSessionSecret: () => "a".repeat(32),
}));

import {
  createOrderEmailAccessToken,
  getOrderEmailAccess,
} from "@/features/customer-orders/server/order-email-access";

const reference = "MG-2026-TRACKING";
const issuedAt = new Date("2026-09-04T12:00:00.000Z");

describe("order email access", () => {
  it("creates a signed, expiring access token scoped to one order", () => {
    const token = createOrderEmailAccessToken(reference, issuedAt);
    const access = getOrderEmailAccess(reference, token);

    expect(access).toMatchObject({ token });
    expect(access?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(getOrderEmailAccess("MG-2026-OTHER", token)).toBeNull();
  });

  it("rejects malformed and expired links", () => {
    const token = createOrderEmailAccessToken(reference, new Date(0));

    expect(getOrderEmailAccess(reference, "not-a-token")).toBeNull();
    expect(getOrderEmailAccess(reference, token)).toBeNull();
  });
});
