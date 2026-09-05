// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CheckoutProgress } from "@/features/delivery-matching/components/checkout-progress";
import {
  BitcoinInvoicePanel,
  PaymentMethodSummary,
} from "@/features/payments/components/payment-confirmation";
import { RechargeCodeConfirmation } from "@/features/payments/components/recharge-code-confirmation";
import { RechargePartnerDirectory } from "@/features/payments/components/recharge-partner-rail";
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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("checkout confirmation presentation", () => {
  it("shows secure confirmation steps and real checkout context", () => {
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
    expect(screen.getByText("Order received")).toBeTruthy();
    expect(screen.queryByText(/balance is available/i)).not.toBeTruthy();
  });

  it("shows the locked method with three secure code fields and can add another", () => {
    render(
      <>
        <PaymentMethodSummary
          method="RECHARGE_ONLINE"
          rechargeProvider="dundle"
        />
        <RechargeCodeConfirmation
          intentId={"a".repeat(32)}
          eligible
          onCompleted={() => undefined}
        />
      </>,
    );
    expect(screen.getByText(/selected:/i).parentElement?.textContent).toContain(
      "Recharge online",
    );
    expect(screen.getAllByLabelText(/Recharge code \d+$/)).toHaveLength(3);
    fireEvent.click(
      screen.getByRole("button", { name: "Add another recharge code" }),
    );
    expect(screen.getAllByLabelText(/Recharge code \d+$/)).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Confirm order" })).toBeTruthy();
    expect(screen.queryByText("Order note")).toBeNull();
  });

  it("shows four trusted online partners and marks the selected partner", () => {
    render(<RechargePartnerDirectory selectedPartnerId="DUNDLE" />);

    expect(
      screen.getByRole("heading", { name: "Approved recharge partners" }),
    ).toBeTruthy();
    expect(screen.getAllByRole("link")).toHaveLength(4);
    const dundle = screen.getByRole("link", {
      name: "Open Dundle in a new tab",
    });
    expect(dundle.getAttribute("aria-current")).toBe("true");
    expect(dundle.getAttribute("target")).toBe("_blank");
    expect(dundle.getAttribute("rel")).toContain("noopener");
  });

  it("submits only recharge codes, never a customer note", async () => {
    const onCompleted = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ order: { reference: "MG-2026-TEST" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getByLabelText, getByRole } = render(
      <RechargeCodeConfirmation
        intentId={"a".repeat(32)}
        eligible
        onCompleted={onCompleted}
      />,
    );
    fireEvent.change(getByLabelText("Recharge code 1"), {
      target: { value: "123456" },
    });
    fireEvent.change(getByLabelText("Recharge code 2"), {
      target: { value: "234567" },
    });
    fireEvent.change(getByLabelText("Recharge code 3"), {
      target: { value: "345678" },
    });
    fireEvent.click(getByRole("button", { name: "Confirm order" }));

    await waitFor(() =>
      expect(onCompleted).toHaveBeenCalledWith("MG-2026-TEST"),
    );
    const [, options] = fetchMock.mock.calls[0] ?? [];
    const body = JSON.parse(String((options as RequestInit | undefined)?.body));
    expect(body).toEqual({
      verificationCodes: ["123456", "234567", "345678"],
    });
  });

  it("continues only from a server-settled Bitcoin attempt", async () => {
    const onCompleted = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          attempt: {
            publicId: "payment-attempt",
            providerInvoiceId: "provider-invoice",
            paymentAddress: "bc1qpaymentaddress",
            paymentUri: "bitcoin:bc1qpaymentaddress?amount=0.00010000",
            bitcoinAmount: "0.00010000",
            orderReference: "MG-2026-BTC",
            depositMinor: 2_500,
            cashBalanceMinor: 2_500,
            status: "SETTLED",
            expiresAt: "2099-01-01T00:00:00.000Z",
          },
        }),
      }),
    );

    render(
      <BitcoinInvoicePanel
        intentId={"b".repeat(32)}
        currency="EUR"
        depositMinor={2_500}
        cashBalanceMinor={2_500}
        onCompleted={onCompleted}
      />,
    );

    await waitFor(() =>
      expect(onCompleted).toHaveBeenCalledWith("MG-2026-BTC"),
    );
    expect(screen.getByText("Payment confirmed")).toBeTruthy();
  });
});
