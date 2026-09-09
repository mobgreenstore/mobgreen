// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/en.json";
import { STOREFRONT_LOCALE_COOKIE } from "@/i18n/config";
import { StoreLocaleControl } from "./store-locale-control";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

afterEach(() => {
  cleanup();
  refresh.mockClear();
  document.cookie = `${STOREFRONT_LOCALE_COOKIE}=; Path=/; Max-Age=0`;
});

describe("StoreLocaleControl", () => {
  it("persists a manual language choice and refreshes the current page", async () => {
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <StoreLocaleControl />
      </NextIntlClientProvider>,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Change language. Current language: English.",
      }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Français" }));

    expect(document.cookie).toContain(`${STOREFRONT_LOCALE_COOKIE}=fr`);
    expect(refresh).toHaveBeenCalledOnce();
  });
});
