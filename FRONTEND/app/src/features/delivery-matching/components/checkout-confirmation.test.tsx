// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CheckoutProgress } from "@/features/delivery-matching/components/checkout-progress";
import { VerificationHero } from "@/features/delivery-matching/components/verification-hero";
import type { CheckoutConfirmationView } from "@/features/delivery-matching/types";

const intent: CheckoutConfirmationView = {
  publicId: "a".repeat(32),
  status: "DRIVER_SELECTED",
  fulfillmentType: "DELIVERY",
  paymentMethod: "RECHARGE_ONLINE",
  rechargeProvider: "dundle",
  currency: "EUR",
  subtotalMinor: 5_000,
  location: {
    formattedAddress: "Dublin, Ireland",
    postalCode: "D02",
    locality: "Dublin",
    countryCode: "IE",
  },
  candidates: [],
  selectedCourier: {
    candidateId: "courier-1",
    displayName: "Maxime97",
    distanceMeters: 1_200,
    estimatedDurationSeconds: 900,
  },
  expiresAt: "2099-01-01T00:00:00.000Z",
  customer: { name: "Pericles Ngon", email: "customer@example.com" },
  lines: [
    {
      key: "line-1",
      productName: "Real product",
      image: null,
      weightValue: 100,
      weightUnit: "G",
      quantity: 1,
      unitPriceMinor: 5_000,
      lineTotalMinor: 5_000,
      discountBps: null,
    },
  ],
  itemCount: 1,
  confirmationEligible: true,
};

describe("checkout confirmation presentation", () => {
  it("shows an honest review step and real checkout context", () => {
    render(
      <>
        <VerificationHero intent={intent} />
        <CheckoutProgress />
      </>,
    );
    expect(
      screen.getByRole("heading", {
        name: "Confirm your recharge. Start your order.",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Pericles Ngon")).toBeTruthy();
    expect(screen.getByText("Recharge online · dundle")).toBeTruthy();
    expect(screen.getByText("Admin approval")).toBeTruthy();
    expect(screen.queryByText(/balance is available/i)).not.toBeTruthy();
  });
});
