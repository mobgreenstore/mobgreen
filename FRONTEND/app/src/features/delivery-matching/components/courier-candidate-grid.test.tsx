// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CourierCandidateGrid } from "@/features/delivery-matching/components/courier-candidate-grid";

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

afterEach(cleanup);

describe("courier candidate grid", () => {
  it("renders typed simulated details and accessible selection controls", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <CourierCandidateGrid candidates={candidates} onSelect={onSelect} />,
    );
    expect(screen.getByText("850 m")).toBeInTheDocument();
    expect(screen.getByText("2.4 km")).toBeInTheDocument();
    const choose = screen.getByRole("button", {
      name: /Choose Maxime97, simulated 850 m away, estimated 15 min/i,
    });
    expect(choose).toHaveAttribute("aria-pressed", "false");
    await user.click(choose);
    expect(onSelect).toHaveBeenCalledWith(candidates[0]);
  });

  it("announces and visually exposes the selected profile", () => {
    render(
      <CourierCandidateGrid
        candidates={candidates}
        selectedCandidateId="courier-gv-874"
        onSelect={() => undefined}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: /Selected Gustavo874, simulated 2.4 km away/i,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByText("Selected", { selector: ".sr-only" }),
    ).toBeInTheDocument();
  });
});
