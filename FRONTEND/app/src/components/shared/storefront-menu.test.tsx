// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StorefrontMenu } from "./storefront-menu";

vi.mock("next/navigation", () => ({
  usePathname: () => "/recharge-online",
}));

afterEach(cleanup);

describe("StorefrontMenu", () => {
  it("opens accessible text-only navigation with the approved routes", async () => {
    const user = userEvent.setup();
    render(<StorefrontMenu />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    expect(screen.getByRole("dialog", { name: "Menu" })).toBeVisible();
    const navigation = screen.getByRole("navigation", {
      name: "Storefront menu",
    });
    expect(
      within(navigation).getByRole("button", { name: "Get Recharge" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      within(navigation).getByText("Recharge from store").parentElement,
    ).toHaveAttribute("aria-disabled", "true");
    expect(within(navigation).getByText("Unavailable")).toHaveClass("sr-only");
    expect(
      within(navigation).getByRole("link", { name: "Recharge online" }),
    ).toHaveAttribute("href", "/recharge-online");
    expect(
      within(navigation).getByRole("link", { name: "Recharge online" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(navigation).getByRole("link", { name: "Track orders" }),
    ).toHaveAttribute("href", "/orders");
    expect(navigation.querySelectorAll("svg")).toHaveLength(1);
  });

  it("closes with Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<StorefrontMenu />);

    const trigger = screen.getByRole("button", { name: "Open menu" });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("collapses the recharge options", async () => {
    const user = userEvent.setup();
    render(<StorefrontMenu />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const recharge = screen.getByRole("button", { name: "Get Recharge" });
    await user.click(recharge);

    expect(recharge).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("link", { name: "Recharge online" }),
    ).not.toBeInTheDocument();
  });
});
