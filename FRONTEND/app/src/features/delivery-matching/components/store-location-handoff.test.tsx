// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadDeliveryLocation = vi.hoisted(() => vi.fn());

vi.mock("@/features/location/storage", () => ({
  loadDeliveryLocation,
  saveDeliveryLocation: vi.fn(),
  clearDeliveryLocation: vi.fn(),
}));

import { StoreLocationControl } from "@/features/location/components/store-location-control";

const location = {
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
  confirmedAt: "2026-08-23T00:00:00.000Z",
};

describe("Phase 24 location handoff", () => {
  beforeEach(() => {
    loadDeliveryLocation.mockReturnValue(location);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            orders: [],
            page: 1,
            pageCount: 1,
            total: 0,
            tab: "active",
          }),
          { status: 200 },
        ),
      ),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("reuses a saved confirmed location through the text trigger", async () => {
    const user = userEvent.setup();
    const onLocationChange = vi.fn();
    render(
      <StoreLocationControl
        triggerVariant="text"
        triggerLabel="Activate location"
        onLocationChange={onLocationChange}
      />,
    );
    await user.click(
      await screen.findByRole("button", { name: /Change location:/i }),
    );
    await user.click(screen.getByRole("button", { name: "Use this location" }));
    expect(onLocationChange).toHaveBeenCalledWith(location);
    expect(
      screen.queryByRole("heading", { name: "Your location" }),
    ).not.toBeInTheDocument();
  });
});
