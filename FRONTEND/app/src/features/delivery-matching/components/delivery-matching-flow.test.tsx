// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/location/components/store-location-control", () => ({
  StoreLocationControl: ({ triggerLabel }: { triggerLabel?: string }) => (
    <button type="button">{triggerLabel ?? "Location"}</button>
  ),
}));

import { DeliveryMatchingFlow } from "@/features/delivery-matching/components/delivery-matching-flow";
import type { CheckoutIntentView } from "@/features/delivery-matching/types";

const candidates = [
  {
    candidateId: "courier-mx-97",
    displayName: "Maxime97",
    distanceMeters: 850,
    estimatedDurationSeconds: 900,
  },
  {
    candidateId: "courier-gv-874",
    displayName: "Gustavo874",
    distanceMeters: 2_400,
    estimatedDurationSeconds: 1_500,
  },
];
const initialIntent: CheckoutIntentView = {
  publicId: "a".repeat(32),
  status: "DRIVER_SELECTED",
  fulfillmentType: "DELIVERY",
  paymentMethod: "RECHARGE_FROM_STORE",
  rechargeProvider: null,
  currency: "EUR",
  subtotalMinor: 2_500,
  location: {
    formattedAddress: "1 Test Street, Dublin",
    postalCode: "D02",
    locality: "Dublin",
    countryCode: "IE",
  },
  candidates,
  selectedCourier: candidates[0]!,
  expiresAt: "2099-01-01T00:00:00.000Z",
};

describe("delivery matching flow recovery", () => {
  beforeEach(() => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("prevents duplicate courier-selection requests", () => {
    const request = vi.fn(() => new Promise<Response>(() => undefined));
    vi.stubGlobal("fetch", request);
    render(<DeliveryMatchingFlow initialIntent={initialIntent} />);
    const choose = screen.getByRole("button", { name: /Choose Gustavo874/i });
    fireEvent.click(choose);
    fireEvent.click(choose);
    expect(request).toHaveBeenCalledOnce();
  });

  it("disables selection offline and recovers on the online event", async () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });
    render(<DeliveryMatchingFlow initialIntent={initialIntent} />);
    expect(await screen.findByText("You are offline")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Choose Gustavo874/i }),
    ).toBeDisabled();

    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
    fireEvent(window, new Event("online"));
    await waitFor(() =>
      expect(screen.queryByText("You are offline")).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: /Choose Gustavo874/i }),
    ).toBeEnabled();
  });

  it("shows a generic provider error and supports recovery", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "Delivery matching is temporarily unavailable.",
          }),
          {
            status: 503,
          },
        ),
      ),
    );
    render(<DeliveryMatchingFlow initialIntent={initialIntent} />);
    fireEvent.click(screen.getByRole("button", { name: /Choose Gustavo874/i }));
    expect(
      await screen.findByText("Delivery matching unavailable"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(
      screen.queryByText("Delivery matching unavailable"),
    ).not.toBeInTheDocument();
  });
});
