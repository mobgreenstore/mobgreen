// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-map-gl/mapbox", async () => {
  const React = await import("react");

  return {
    default: React.forwardRef(function MockMap(
      {
        children,
        ...props
      }: React.PropsWithChildren<{ "aria-label"?: string }>,
      ref,
    ) {
      void ref;
      return (
        <div role="img" aria-label={props["aria-label"]}>
          {children}
        </div>
      );
    }),
    Layer: ({ id }: { id: string }) => <div data-testid={`layer-${id}`} />,
    Marker: ({ children }: React.PropsWithChildren) => <>{children}</>,
    NavigationControl: () => null,
    Source: ({
      id,
      data,
      children,
    }: React.PropsWithChildren<{ id: string; data: unknown }>) => (
      <div data-testid={`source-${id}`} data-geometry={JSON.stringify(data)}>
        {children}
      </div>
    ),
  };
});

import { TrackingMap } from "@/features/location/components/tracking-map";
import type { PublicDeliveryTracking } from "@/features/tracking/types";

const tracking: PublicDeliveryTracking = {
  state: "ACTIVE",
  routeKind: "DRIVING",
  routeDisclosure: "Simulated courier progress.",
  geometry: {
    type: "LineString",
    coordinates: [
      [0, 0],
      [1, 0],
      [4, 0],
    ],
  },
  origin: [0, 0],
  destination: [4, 0],
  courier: [2, 0],
  routeDistanceMeters: 444_000,
  distanceRemainingMeters: 222_000,
  estimatedDurationSeconds: 1_200,
  timeRemainingSeconds: 600,
  dispatchedAt: "2026-09-04T10:00:00.000Z",
  estimatedArrivalAt: "2026-09-04T10:20:00.000Z",
  serverTimestamp: "2026-09-04T10:10:00.000Z",
  progress: 0.5,
};

describe("delivery tracking map", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = "test-token";
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
    delete process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  });

  it("renders distinct completed and courier-to-recipient route segments", () => {
    render(<TrackingMap tracking={tracking} />);

    const completed = JSON.parse(
      screen
        .getByTestId("source-delivery-route-completed-source")
        .getAttribute("data-geometry")!,
    );
    const remaining = JSON.parse(
      screen
        .getByTestId("source-delivery-route-remaining-source")
        .getAttribute("data-geometry")!,
    );

    expect(completed.geometry.coordinates).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
    ]);
    expect(remaining.geometry.coordinates).toEqual([
      [2, 0],
      [4, 0],
    ]);
    expect(
      screen.getByTestId("layer-delivery-route-completed"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("layer-delivery-route-remaining"),
    ).toBeInTheDocument();
  });
});
