// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import {
  loadCheckoutContact,
  saveCheckoutContact,
} from "@/features/checkout/contact-storage";

describe("checkout contact storage", () => {
  beforeEach(() => localStorage.clear());

  it("restores contact details saved on this device", () => {
    saveCheckoutContact({
      customerName: "Customer Name",
      customerEmail: "customer@example.com",
    });

    expect(loadCheckoutContact()).toEqual({
      customerName: "Customer Name",
      customerEmail: "customer@example.com",
    });
  });

  it("ignores invalid browser data", () => {
    localStorage.setItem("mob-greens-checkout-contact", "{invalid");
    expect(loadCheckoutContact()).toEqual({
      customerName: "",
      customerEmail: "",
    });
  });
});
