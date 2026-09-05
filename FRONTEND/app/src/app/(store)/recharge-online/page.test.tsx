// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RECHARGE_PARTNERS } from "@/config/recharge";
import RechargeOnlinePage from "./page";

afterEach(cleanup);

describe("RechargeOnlinePage", () => {
  it("renders every approved partner as a safe external link", () => {
    render(<RechargeOnlinePage />);

    for (const partner of RECHARGE_PARTNERS) {
      const link = screen.getByRole("link", {
        name: `Open ${partner.name} in a new tab`,
      });
      expect(link).toHaveAttribute("href", partner.url);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("explains the external handoff and returns customers to checkout", () => {
    render(<RechargeOnlinePage />);

    expect(
      screen.getByText(/does not receive or store your card details/i),
    ).toBeVisible();
    expect(
      screen.getByText(/return to All Verification and submit that code/i),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /return to checkout/i }),
    ).toHaveAttribute("href", "/checkout");
  });
});
