// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RechargePartnerCard } from "@/features/recharge/components/recharge-partner-card";

afterEach(cleanup);

describe("recharge partner card", () => {
  it("records the selected partner and opens its real website in a new tab", () => {
    const onSelect = vi.fn();

    render(
      <RechargePartnerCard
        name="Startselect"
        url="https://startselect.com/example"
        iconUrl="/images/partners/startselect.png"
        selected
        onSelect={onSelect}
      />,
    );

    const partner = screen.getByRole("link", {
      name: "Open Startselect in a new tab",
    });
    expect(partner).toHaveAttribute("href", "https://startselect.com/example");
    expect(partner).toHaveAttribute("target", "_blank");
    expect(partner).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(partner).toHaveAttribute("aria-current", "true");

    fireEvent.click(partner);
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
