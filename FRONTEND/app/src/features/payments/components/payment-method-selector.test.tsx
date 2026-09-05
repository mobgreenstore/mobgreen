// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { PaymentMethodSelector } from "@/features/payments/components/payment-method-selector";
import type { PaymentMethodId } from "@/features/payments/payment-method";

function Harness({ bitcoinAvailable = true }: { bitcoinAvailable?: boolean }) {
  const [value, setValue] = useState<PaymentMethodId>("RECHARGE_FROM_STORE");
  return (
    <PaymentMethodSelector
      value={value}
      bitcoinAvailable={bitcoinAvailable}
      onChange={setValue}
    />
  );
}

describe("checkout payment method selector", () => {
  afterEach(cleanup);

  it("switches the compact radio group and exposes selected details", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const group = screen.getByRole("group", { name: "Payment method" });
    const store = screen.getByRole("radio", {
      name: "Recharge from store",
    });
    const online = screen.getByRole("radio", { name: "Recharge online" });

    expect(group).toBeInTheDocument();
    const selectorGrid = group.querySelector(":scope > div");
    expect(selectorGrid).toHaveClass("grid-cols-3");
    expect(selectorGrid).not.toHaveClass("overflow-x-auto");
    expect(store.closest("label")).toHaveClass("min-w-0");
    expect(online.closest("label")).toHaveClass("min-w-0");
    expect(store).toBeChecked();
    expect(
      screen.getByText("Use a code bought in person."),
    ).toBeInTheDocument();

    await user.click(online);

    expect(online).toBeChecked();
    expect(store).not.toBeChecked();
    expect(
      screen.getByText("Buy a code from a listed partner."),
    ).toBeInTheDocument();
  });

  it("keeps Bitcoin visible but unavailable when invoice setup is disabled", () => {
    render(<Harness bitcoinAvailable={false} />);

    expect(
      screen.getByRole("radio", { name: "Bitcoin — 50% deposit" }),
    ).toBeDisabled();
  });
});
