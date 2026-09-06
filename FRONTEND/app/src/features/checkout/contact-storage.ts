"use client";

const CONTACT_STORAGE_KEY = "mob-greens-checkout-contact";

export type CheckoutContact = {
  customerName: string;
  customerEmail: string;
};

const emptyContact: CheckoutContact = {
  customerName: "",
  customerEmail: "",
};

export function loadCheckoutContact(): CheckoutContact {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(CONTACT_STORAGE_KEY) ?? "null",
    );
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as CheckoutContact).customerName !== "string" ||
      typeof (parsed as CheckoutContact).customerEmail !== "string"
    ) {
      return emptyContact;
    }
    return {
      customerName: (parsed as CheckoutContact).customerName.slice(0, 120),
      customerEmail: (parsed as CheckoutContact).customerEmail.slice(0, 320),
    };
  } catch {
    return emptyContact;
  }
}

export function saveCheckoutContact(contact: CheckoutContact) {
  localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(contact));
}
