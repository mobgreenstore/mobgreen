// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CurrencySelect } from "./currency-select";
import { formatMoney, Money } from "./money";
import { OrderSummary } from "./order-summary";
import { QuantityStepper } from "./quantity-stepper";
import { formatWeight } from "./weight-display";
import { WeightPriceSelector } from "./weight-price-selector";
import type { WeightPriceOption } from "@/types/commerce";

afterEach(cleanup);

const option: WeightPriceOption = {
  id: "option-id",
  weightValue: 500,
  weightUnit: "G",
  currency: "GBP",
  priceMinor: 1299,
  available: true,
};

describe("commerce formatting", () => {
  it("formats integer minor units with the selected currency", () => {
    expect(formatMoney(1299, "GBP", "en-GB")).toBe("£12.99");
    render(<Money amountMinor={1050} currency="EUR" locale="en-IE" />);
    expect(screen.getByText("€10.50")).toBeVisible();
  });

  it("formats supported weights", () => {
    expect(formatWeight(500, "G")).toBe("500 g");
    expect(formatWeight(1.5, "KG")).toBe("1.5 kg");
  });

  it("builds currency choices from central configuration", () => {
    render(<CurrencySelect aria-label="Currency" />);
    expect(screen.getByRole("option", { name: /British pound/ })).toHaveValue(
      "GBP",
    );
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });
});

describe("commerce interactions", () => {
  it("returns the selected real option identifier", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <WeightPriceSelector
        options={[option]}
        onSelectionChange={onSelectionChange}
      />,
    );
    await user.click(screen.getByRole("radio"));
    expect(onSelectionChange).toHaveBeenCalledWith("option-id");
  });

  it("enforces quantity boundaries", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantityStepper value={1} min={1} max={2} onChange={onChange} />);
    expect(
      screen.getByRole("button", { name: "Decrease quantity" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("presents a currency-consistent order summary", () => {
    render(
      <OrderSummary
        currency="USD"
        subtotalMinor={1000}
        deliveryFeeMinor={200}
        totalMinor={1200}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Order summary" }),
    ).toBeVisible();
    expect(screen.getByText("$12.00")).toBeVisible();
  });
});
