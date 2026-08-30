import { describe, expect, it } from "vitest";
import {
  buildAdminOrderEmail,
  maskVerificationCode,
} from "@/features/order-notifications/server/template";

describe("admin order email", () => {
  it("masks the sensitive recharge code", () => {
    expect(maskVerificationCode("1234 5678 9012")).toBe("•••••••• 9012");
    expect(maskVerificationCode("")).toBe("Unavailable");
  });

  it("includes real order details without exposing the full code", () => {
    const fullCode = "123456789012";
    const email = buildAdminOrderEmail({
      adminOrderUrl: "http://localhost:3000/admin/orders/order-id",
      reference: "MG-2026-ABC",
      customerName: "Customer <name>",
      customerEmail: "customer@example.com",
      customerPhone: null,
      fulfillment: "DELIVERY",
      paymentMethod: "RECHARGE_ONLINE",
      rechargeProvider: "Dundle",
      deliveryAddress: "10 Example Street",
      courierName: "Maxime97",
      currency: "EUR",
      totalMinor: 25_000,
      createdAt: new Date("2026-08-29T18:00:00.000Z"),
      maskedVerificationCode: maskVerificationCode(fullCode),
      items: [
        {
          name: "Product <one>",
          weightValue: 100,
          weightUnit: "G",
          quantity: 2,
          lineTotalMinor: 25_000,
        },
      ],
    });
    expect(email.subject).toContain("MG-2026-ABC");
    expect(email.text).toContain("Dundle");
    expect(email.text).toContain("Maxime97");
    expect(email.text).not.toContain(fullCode);
    expect(email.html).not.toContain(fullCode);
    expect(email.html).toContain("Customer &lt;name&gt;");
  });
});
