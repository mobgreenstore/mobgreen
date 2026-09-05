// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import {
  FulfillmentSelector,
  type FulfillmentType,
} from "@/features/checkout/components/fulfillment-selector";

function Harness() {
  const [value, setValue] = useState<FulfillmentType>("PICKUP");
  return <FulfillmentSelector value={value} onChange={setValue} />;
}

describe("checkout fulfillment selector", () => {
  it("keeps pickup and delivery in one accessible radio group", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const group = screen.getByRole("group", {
      name: "Choose pickup or delivery",
    });
    const pickup = screen.getByRole("radio", { name: "Pickup" });
    const delivery = screen.getByRole("radio", { name: "Delivery" });

    expect(group).toBeInTheDocument();
    const selectorGrid = group.querySelector(":scope > div");
    expect(selectorGrid).toHaveClass("grid-cols-2");
    expect(selectorGrid).not.toHaveClass("overflow-x-auto");
    expect(pickup.closest("label")).toHaveClass("min-w-0");
    expect(delivery.closest("label")).toHaveClass("min-w-0");
    expect(pickup).toBeChecked();
    expect(delivery).not.toBeChecked();
    expect(
      screen.getByText("Collect your order after payment is confirmed."),
    ).toBeInTheDocument();

    await user.click(delivery);

    expect(delivery).toBeChecked();
    expect(pickup).not.toBeChecked();
    expect(
      screen.getByText(/Confirm your location, then choose a nearby/i),
    ).toBeInTheDocument();
  });
});
