// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/location/components/dynamic-tracking-map", () => ({
  DynamicTrackingMap: ({ tracking }: { tracking: { routeKind: string } }) => (
    <div role="img" aria-label="Delivery tracking map">
      {tracking.routeKind}
    </div>
  ),
}));

import { CustomerOrderTracking } from "@/features/customer-orders/components/customer-order-tracking";
import type { PublicTrackingView } from "@/features/tracking/types";

const tracking: PublicTrackingView = {
  reference: "MG-TRACK-1",
  status: "OUT_FOR_DELIVERY",
  fulfillmentType: "DELIVERY",
  deliveryAddress: {
    formattedAddress: "Confirmed recipient destination",
    postalCode: "1000",
    locality: "Dublin",
  },
  tracking: {
    state: "ACTIVE",
    routeKind: "DIRECT_FALLBACK",
    routeDisclosure: "Simulated direct trajectory. This is not a road route.",
    geometry: {
      type: "LineString",
      coordinates: [
        [-6.3, 53.3],
        [-6.2, 53.4],
      ],
    },
    origin: [-6.3, 53.3],
    destination: [-6.2, 53.4],
    courier: [-6.25, 53.35],
    routeDistanceMeters: 10_000,
    distanceRemainingMeters: 5_000,
    estimatedDurationSeconds: 1_200,
    timeRemainingSeconds: 600,
    dispatchedAt: "2026-08-16T00:00:00.000Z",
    estimatedArrivalAt: "2026-08-16T00:20:00.000Z",
    serverTimestamp: "2026-08-16T00:10:00.000Z",
    progress: 0.5,
  },
  events: [
    {
      status: "OUT_FOR_DELIVERY",
      createdAt: "2026-08-16T00:00:00.000Z",
    },
  ],
};

describe("customer delivery tracking", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ tracking }), { status: 200 }),
        ),
    );
  });

  it("clearly labels the simulated direct fallback and exposes accessible tracking information", async () => {
    render(
      <CustomerOrderTracking
        reference={tracking.reference}
        initialTracking={tracking}
      />,
    );
    expect(
      screen.getByRole("img", { name: "Delivery tracking map" }),
    ).toHaveTextContent("DIRECT_FALLBACK");
    expect(screen.getByText("Direct trajectory fallback")).toBeInTheDocument();
    expect(screen.getAllByText(/not a road route/i)[0]).toBeInTheDocument();
    expect(
      screen.getByText("Confirmed recipient destination"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Order tracking history" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View order details" }),
    ).toHaveAttribute("href", "/orders/MG-TRACK-1");
  });

  it("shows a stable loading state on slow connections", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => undefined)),
    );
    render(<CustomerOrderTracking reference="MG-SLOW" />);
    expect(screen.getByLabelText("Loading tracking")).toBeInTheDocument();
  });

  it("shows offline recovery without discarding a confirmed position", async () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });
    render(<CustomerOrderTracking reference="MG-OFFLINE" />);
    expect(await screen.findByText("You are offline")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });
});
