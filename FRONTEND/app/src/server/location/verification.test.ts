import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/environment", () => ({
  getSessionSecret: () => "test-secret-with-at-least-thirty-two-characters",
}));

let signLocationCandidate: typeof import("@/server/location/verification").signLocationCandidate;
let verifyLocationCandidate: typeof import("@/server/location/verification").verifyLocationCandidate;

beforeAll(async () => {
  ({ signLocationCandidate, verifyLocationCandidate } =
    await import("@/server/location/verification"));
});

const candidate = {
  formattedAddress: "Dublin, Ireland",
  postalCode: "D02",
  locality: "Dublin",
  region: "Leinster",
  country: "Ireland",
  countryCode: "IE",
  latitude: 53.3498,
  longitude: -6.2603,
  mapboxPlaceId: "mapbox.place.dublin",
  source: "POSTAL_CODE" as const,
};

describe("server-verified locations", () => {
  it("round-trips a server-signed provider result", () => {
    expect(verifyLocationCandidate(signLocationCandidate(candidate))).toEqual(
      candidate,
    );
  });

  it("rejects a tampered location token", () => {
    const token = signLocationCandidate(candidate);
    expect(verifyLocationCandidate(`x${token.slice(1)}`)).toBeNull();
  });
});
