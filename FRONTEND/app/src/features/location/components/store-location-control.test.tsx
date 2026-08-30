// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadDeliveryLocation = vi.hoisted(() => vi.fn());
const saveDeliveryLocation = vi.hoisted(() => vi.fn());
const clearDeliveryLocation = vi.hoisted(() => vi.fn());

vi.mock("@/features/location/storage", () => ({
  loadDeliveryLocation,
  saveDeliveryLocation,
  clearDeliveryLocation,
}));

import { StoreLocationControl } from "@/features/location/components/store-location-control";

const candidate = {
  formattedAddress: "1 Test Street, Dublin",
  postalCode: "D02",
  locality: "Dublin",
  region: "Leinster",
  country: "Ireland",
  countryCode: "IE",
  latitude: 53.34,
  longitude: -6.26,
  mapboxPlaceId: "mapbox.place.test",
  source: "POSTAL_CODE" as const,
  verificationToken: "v".repeat(48),
};

const confirmedLocation = {
  ...candidate,
  confirmedAt: "2026-08-16T00:00:00.000Z",
};

describe("store location control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadDeliveryLocation.mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows actionable permission-denied guidance", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (
          _success: PositionCallback,
          error: PositionErrorCallback,
        ) =>
          error({
            code: 1,
            message: "denied",
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          }),
      },
    });
    render(<StoreLocationControl />);
    await user.click(
      await screen.findByRole("button", { name: "Choose your location" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Use my current location" }),
    );
    expect(
      await screen.findByText(/Location permission was denied/i),
    ).toBeInTheDocument();
  });

  it("requires an exact postal suggestion and confirms it through the server", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (request: RequestInfo | URL) => {
        const url = String(request);
        if (url.includes("/api/location/confirm")) {
          return new Response(JSON.stringify({ location: confirmedLocation }), {
            status: 200,
          });
        }
        return new Response(JSON.stringify({ suggestions: [candidate] }), {
          status: 200,
        });
      }),
    );
    render(<StoreLocationControl />);
    await user.click(
      await screen.findByRole("button", { name: "Choose your location" }),
    );
    await user.type(screen.getByLabelText("ZIP or postal code"), "d02");
    await user.click(screen.getByRole("button", { name: "Search" }));
    await user.click(
      await screen.findByRole("button", { name: /1 Test Street/i }),
    );
    await user.click(screen.getByRole("button", { name: "Use this location" }));
    await waitFor(() =>
      expect(saveDeliveryLocation).toHaveBeenCalledWith(confirmedLocation),
    );
  });

  it("resolves current coordinates through the server before selection", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (success: PositionCallback) =>
          success({
            coords: {
              latitude: 53.34,
              longitude: -6.26,
              accuracy: 5,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
              toJSON: () => ({}),
            },
            timestamp: Date.now(),
            toJSON: () => ({}),
          }),
      },
    });
    const currentCandidate = { ...candidate, source: "CURRENT_LOCATION" };
    const provider = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ suggestions: [currentCandidate] }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", provider);
    render(<StoreLocationControl />);
    await user.click(
      await screen.findByRole("button", { name: "Choose your location" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Use my current location" }),
    );
    expect(
      await screen.findByRole("button", { name: /1 Test Street/i }),
    ).toBeInTheDocument();
    expect(provider).toHaveBeenCalledWith(
      "/api/location/search",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("CURRENT_LOCATION"),
      }),
    );
  });

  it("loads real recent orders for a returning browser location", async () => {
    const user = userEvent.setup();
    loadDeliveryLocation.mockReturnValue(confirmedLocation);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            orders: [
              {
                reference: "MG-RETURN-1",
                status: "OUT_FOR_DELIVERY",
                paymentStatus: "PAID",
                fulfillmentType: "DELIVERY",
                currency: "EUR",
                totalMinor: 2500,
                createdAt: "2026-08-16T00:00:00.000Z",
                estimatedDelivery: "2026-08-16T01:00:00.000Z",
                firstImage: null,
                itemCount: 1,
                trackingAvailable: true,
              },
            ],
            page: 1,
            pageCount: 1,
            total: 1,
            tab: "active",
          }),
          { status: 200 },
        ),
      ),
    );
    render(<StoreLocationControl />);
    const trigger = await screen.findByRole("button", { name: /Location:/i });
    await user.click(trigger);
    expect(await screen.findByText("MG-RETURN-1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View tracking" })).toHaveAttribute(
      "href",
      "/orders/MG-RETURN-1/tracking",
    );
  });
});
