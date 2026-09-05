import type { SupportedCurrency, WeightUnit } from "@/config/commerce";
import { paymentMethodLabel } from "@/features/payments/payment-method";

export interface AdminOrderEmailInput {
  adminOrderUrl: string;
  reference: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  fulfillment: "PICKUP" | "DELIVERY";
  paymentMethod: "RECHARGE_FROM_STORE" | "RECHARGE_ONLINE" | "BITCOIN_DEPOSIT";
  rechargeProvider: string | null;
  deliveryAddress: string | null;
  courierName: string | null;
  currency: SupportedCurrency;
  totalMinor: number;
  createdAt: Date;
  maskedVerificationCode: string;
  items: Array<{
    name: string;
    weightValue: number;
    weightUnit: WeightUnit;
    quantity: number;
    lineTotalMinor: number;
  }>;
}

export interface CustomerOrderEmailInput {
  storefrontUrl: string;
  orderUrl: string;
  trackingUrl: string;
  logoUrl: string;
  reference: string;
  customerName: string;
  fulfillment: "PICKUP" | "DELIVERY";
  paymentMethod: "RECHARGE_FROM_STORE" | "RECHARGE_ONLINE" | "BITCOIN_DEPOSIT";
  rechargeProvider: string | null;
  deliveryAddress: string | null;
  courierName: string | null;
  currency: SupportedCurrency;
  totalMinor: number;
  createdAt: Date;
  maskedRechargeCodes?: string[];
  items: Array<{
    name: string;
    weightValue: number;
    weightUnit: WeightUnit;
    quantity: number;
    lineTotalMinor: number;
  }>;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(amountMinor: number, currency: SupportedCurrency) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
  }).format(amountMinor / 100);
}

function weight(value: number, unit: WeightUnit) {
  return `${new Intl.NumberFormat("en", {
    maximumFractionDigits: 3,
  }).format(value)} ${unit === "KG" ? "kg" : "g"}`;
}

function submittedAt(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(value);
}

function plainTextItems(
  items: Array<{
    name: string;
    weightValue: number;
    weightUnit: WeightUnit;
    quantity: number;
    lineTotalMinor: number;
  }>,
  currency: SupportedCurrency,
) {
  return items
    .map(
      (item) =>
        `- ${item.name} · ${weight(item.weightValue, item.weightUnit)} · Qty ${item.quantity} · ${money(item.lineTotalMinor, currency)}`,
    )
    .join("\n");
}

function itemRows(
  items: Array<{
    name: string;
    weightValue: number;
    weightUnit: WeightUnit;
    quantity: number;
    lineTotalMinor: number;
  }>,
  currency: SupportedCurrency,
) {
  return items
    .map(
      (item) =>
        `<tr><td style="padding:14px 0;border-bottom:1px solid #e8e8e5;font-size:14px;line-height:20px"><strong style="font-weight:600;color:#161817">${escapeHtml(item.name)}</strong><br><span style="color:#686d68;font-size:12px">${escapeHtml(weight(item.weightValue, item.weightUnit))} · Qty ${item.quantity}</span></td><td align="right" style="padding:14px 0;border-bottom:1px solid #e8e8e5;font-size:14px;font-weight:600;white-space:nowrap;color:#161817">${escapeHtml(money(item.lineTotalMinor, currency))}</td></tr>`,
    )
    .join("");
}

function detailsRow(label: string, value: string) {
  return `<tr><td style="padding:7px 0;color:#686d68;font-size:13px;vertical-align:top">${escapeHtml(label)}</td><td align="right" style="padding:7px 0;color:#161817;font-size:13px;font-weight:500;line-height:19px;vertical-align:top">${escapeHtml(value)}</td></tr>`;
}

export function maskVerificationCode(code: string) {
  const digits = code.replace(/\D/g, "");
  if (!digits) return "Unavailable";
  const visible = digits.slice(-4);
  const masked = "•".repeat(Math.max(4, digits.length - visible.length));
  return `${masked} ${visible}`;
}

export function buildAdminOrderEmail(input: AdminOrderEmailInput) {
  const payment = paymentMethodLabel(
    input.paymentMethod,
    input.rechargeProvider,
  );
  const fulfillment = input.fulfillment === "DELIVERY" ? "Delivery" : "Pickup";
  const location = input.deliveryAddress ?? "Pickup";
  const submitted = submittedAt(input.createdAt);
  const items = plainTextItems(input.items, input.currency);
  const text = [
    "MOB GREENS · New order received",
    `Reference: ${input.reference}`,
    `Submitted: ${input.createdAt.toISOString()}`,
    "",
    "Customer",
    `Name: ${input.customerName}`,
    `Email: ${input.customerEmail ?? "Not provided"}`,
    `Phone: ${input.customerPhone ?? "Not provided"}`,
    "",
    "Order",
    `Total: ${money(input.totalMinor, input.currency)}`,
    `Payment method: ${payment}`,
    `Fulfillment: ${fulfillment}`,
    `Location: ${location}`,
    `Courier: ${input.courierName ?? "Not assigned"}`,
    "",
    `Recharge code: ${input.maskedVerificationCode} (masked for email safety)`,
    "",
    "Items",
    items,
    "",
    `Open securely: ${input.adminOrderUrl}`,
  ].join("\n");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#f4f4f1;color:#161817;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f4f4f1"><tr><td align="center" style="padding:28px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #deded9;border-radius:12px;overflow:hidden"><tr><td style="padding:28px 30px;background:#131715;color:#ffffff"><p style="margin:0;font-size:12px;letter-spacing:.11em;font-weight:700;text-transform:uppercase;color:#c7d3cb">MOB GREENS</p><h1 style="margin:10px 0 0;font-size:28px;line-height:34px;font-weight:700;color:#ffffff">New order received</h1><p style="margin:8px 0 0;font-size:15px;line-height:22px;color:#eef2ee">${escapeHtml(input.reference)}</p></td></tr><tr><td style="padding:30px"><p style="margin:0;font-size:16px;line-height:25px">A customer has submitted an order. The recharge code is masked in this email; open the secure order record to view it.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:26px 0;border-top:1px solid #d9ddd9;border-bottom:1px solid #d9ddd9"><tr><td style="padding:16px 0"><p style="margin:0;color:#686d68;font-size:12px;letter-spacing:.08em;font-weight:700;text-transform:uppercase">Order total</p><p style="margin:5px 0 0;font-size:24px;line-height:30px;font-weight:700">${escapeHtml(money(input.totalMinor, input.currency))}</p></td><td align="right" style="padding:16px 0;font-size:13px;line-height:19px;color:#686d68">Submitted<br><strong style="font-weight:600;color:#161817">${escapeHtml(submitted)} UTC</strong></td></tr></table><h2 style="margin:0 0 10px;font-size:16px;line-height:22px">Customer</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse">${detailsRow("Name", input.customerName)}${detailsRow("Email", input.customerEmail ?? "Not provided")}${detailsRow("Phone", input.customerPhone ?? "Not provided")}</table><h2 style="margin:28px 0 10px;font-size:16px;line-height:22px">Fulfillment</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse">${detailsRow("Method", fulfillment)}${detailsRow("Payment", payment)}${detailsRow("Location", location)}${detailsRow("Courier", input.courierName ?? "Not assigned")}</table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin-top:28px;border-left:3px solid #355e4a;background:#f6f8f5"><tr><td style="padding:14px 16px"><p style="margin:0;color:#4c554f;font-size:12px;letter-spacing:.06em;font-weight:700;text-transform:uppercase">Recharge code</p><p style="margin:6px 0 0;font-family:Consolas,Monaco,monospace;font-size:18px;line-height:24px;font-weight:700;letter-spacing:.04em">${escapeHtml(input.maskedVerificationCode)}</p><p style="margin:6px 0 0;color:#686d68;font-size:12px;line-height:18px">Masked for email safety. The complete code is available only in the secured admin record.</p></td></tr></table><h2 style="margin:30px 0 0;font-size:16px;line-height:22px">Items</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse">${itemRows(input.items, input.currency)}<tr><td style="padding:16px 0 0;font-size:15px;font-weight:700">Total</td><td align="right" style="padding:16px 0 0;font-size:15px;font-weight:700;white-space:nowrap">${escapeHtml(money(input.totalMinor, input.currency))}</td></tr></table><table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:30px"><tr><td style="border-radius:7px;background:#161817"><a href="${escapeHtml(input.adminOrderUrl)}" style="display:inline-block;padding:13px 18px;color:#ffffff;font-size:14px;font-weight:700;line-height:20px;text-decoration:none">Open secure order</a></td></tr></table><p style="margin:22px 0 0;color:#686d68;font-size:12px;line-height:18px">This message contains masked financial information. Sign in to MOB GREENS before viewing sensitive order details.</p></td></tr></table></td></tr></table></body></html>`;

  return {
    subject: `New MOB GREENS order ${input.reference}`,
    text,
    html,
  };
}

export function buildCustomerOrderEmail(input: CustomerOrderEmailInput) {
  const payment = paymentMethodLabel(
    input.paymentMethod,
    input.rechargeProvider,
  );
  const fulfillment = input.fulfillment === "DELIVERY" ? "Delivery" : "Pickup";
  const deliveryDetail =
    input.fulfillment === "DELIVERY"
      ? (input.deliveryAddress ?? "Your confirmed delivery location")
      : "Pickup details will be confirmed by the store.";
  const submitted = submittedAt(input.createdAt);
  const items = plainTextItems(input.items, input.currency);
  const maskedCodes = [...new Set(input.maskedRechargeCodes ?? [])].filter(
    Boolean,
  );
  const codeReference = maskedCodes.length
    ? maskedCodes.join(" · ")
    : "Submitted securely";
  const codeSummary = maskedCodes.length
    ? `Secure code reference: ${codeReference}`
    : "Your payment code was submitted securely.";
  const actionButtons =
    input.fulfillment === "DELIVERY"
      ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin-top:30px"><tr><td width="50%" style="padding-right:6px"><a href="${escapeHtml(input.orderUrl)}" style="display:block;border-radius:7px;background:#161817;padding:13px 8px;color:#ffffff;font-size:13px;font-weight:700;line-height:20px;text-align:center;text-decoration:none">View order</a></td><td width="50%" style="padding-left:6px"><a href="${escapeHtml(input.trackingUrl)}" style="display:block;border:1px solid #c9cec9;border-radius:7px;padding:12px 8px;color:#161817;font-size:13px;font-weight:700;line-height:20px;text-align:center;text-decoration:none">Track delivery</a></td></tr></table>`
      : `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:30px"><tr><td style="border-radius:7px;background:#161817"><a href="${escapeHtml(input.orderUrl)}" style="display:inline-block;padding:13px 18px;color:#ffffff;font-size:14px;font-weight:700;line-height:20px;text-decoration:none">View your order</a></td></tr></table>`;
  const text = [
    "MOB GREENS · Order placed",
    `Reference: ${input.reference}`,
    `Submitted: ${input.createdAt.toISOString()}`,
    "",
    `Hello ${input.customerName},`,
    "Your order has been placed. We will send delivery updates to this email.",
    codeSummary,
    "",
    "Order",
    `Total: ${money(input.totalMinor, input.currency)}`,
    `Payment method: ${payment}`,
    `Fulfillment: ${fulfillment}`,
    `Destination: ${deliveryDetail}`,
    input.courierName
      ? `Nearby delivery profile: ${input.courierName}`
      : "Delivery profile: not selected",
    "",
    "Items",
    items,
    "",
    `View your order: ${input.orderUrl}`,
    ...(input.fulfillment === "DELIVERY"
      ? [`Track delivery: ${input.trackingUrl}`]
      : []),
    "",
    "Full recharge codes are never sent by email.",
  ].join("\n");
  const html = [
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>',
    '<body style="margin:0;padding:0;background:#f4f4f1;color:#161817;font-family:Arial,Helvetica,sans-serif">',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f4f4f1"><tr><td align="center" style="padding:28px 16px">',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #deded9;border-radius:12px;overflow:hidden">',
    '<tr><td style="padding:26px 30px;background:#131715;color:#ffffff">',
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>',
    `<td style="padding-right:12px;vertical-align:middle"><img src="${escapeHtml(input.logoUrl)}" width="40" height="40" alt="MOB GREENS" style="display:block;width:40px;height:40px;border:0;border-radius:10px"></td>`,
    '<td style="vertical-align:middle"><p style="margin:0;font-size:12px;letter-spacing:.11em;font-weight:700;text-transform:uppercase;color:#c7d3cb">MOB GREENS</p><p style="margin:4px 0 0;font-size:13px;line-height:18px;color:#eef2ee">Order receipt</p></td>',
    "</tr></table>",
    `<h1 style="margin:22px 0 0;font-size:28px;line-height:34px;font-weight:700;color:#ffffff">Your order is placed.</h1><p style="margin:8px 0 0;font-size:15px;line-height:22px;color:#eef2ee">${escapeHtml(input.reference)}</p>`,
    '</td></tr><tr><td style="padding:30px">',
    `<p style="margin:0;font-size:16px;line-height:25px">Hello ${escapeHtml(input.customerName)},</p><p style="margin:10px 0 0;color:#505651;font-size:15px;line-height:24px">Your order has been placed. We will send delivery updates to this email address.</p>`,
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:26px 0;border-top:1px solid #d9ddd9;border-bottom:1px solid #d9ddd9"><tr><td style="padding:16px 0"><p style="margin:0;color:#686d68;font-size:12px;letter-spacing:.08em;font-weight:700;text-transform:uppercase">Order total</p><p style="margin:5px 0 0;font-size:24px;line-height:30px;font-weight:700">${escapeHtml(money(input.totalMinor, input.currency))}</p></td><td align="right" style="padding:16px 0;font-size:13px;line-height:19px;color:#686d68">Submitted<br><strong style="font-weight:600;color:#161817">${escapeHtml(submitted)} UTC</strong></td></tr></table>`,
    '<h2 style="margin:0 0 10px;font-size:16px;line-height:22px">Order details</h2>',
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse">${detailsRow("Payment", payment)}${detailsRow("Fulfillment", fulfillment)}${detailsRow("Destination", deliveryDetail)}${detailsRow("Delivery profile", input.courierName ?? "Not selected")}</table>`,
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin-top:26px;border-left:3px solid #355e4a;background:#f6f8f5"><tr><td style="padding:14px 16px"><p style="margin:0;color:#4c554f;font-size:12px;letter-spacing:.06em;font-weight:700;text-transform:uppercase">Payment code secured</p>',
    `<p style="margin:6px 0 0;font-family:Consolas,Monaco,monospace;font-size:16px;line-height:22px;font-weight:700;letter-spacing:.04em">${escapeHtml(codeReference)}</p>`,
    '<p style="margin:6px 0 0;color:#686d68;font-size:12px;line-height:18px">This is a masked reference only. Full recharge codes are kept in the secure order record and are never sent by email.</p></td></tr></table>',
    '<h2 style="margin:30px 0 0;font-size:16px;line-height:22px">Your items</h2>',
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse">${itemRows(input.items, input.currency)}<tr><td style="padding:16px 0 0;font-size:15px;font-weight:700">Total</td><td align="right" style="padding:16px 0 0;font-size:15px;font-weight:700;white-space:nowrap">${escapeHtml(money(input.totalMinor, input.currency))}</td></tr></table>`,
    actionButtons,
    "</td></tr></table>",
    `<p style="margin:14px 0 0;color:#7b807b;font-size:12px;line-height:18px;text-align:center">MOB GREENS · ${escapeHtml(input.storefrontUrl)}</p>`,
    "</td></tr></table></body></html>",
  ].join("");

  return {
    subject: `MOB GREENS order ${input.reference} placed`,
    text,
    html,
  };
}
