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
  return `${new Intl.NumberFormat("en", { maximumFractionDigits: 3 }).format(value)} ${unit === "KG" ? "kg" : "g"}`;
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
  const location = input.deliveryAddress ?? "Pickup";
  const itemText = input.items
    .map(
      (item) =>
        `- ${item.name} · ${weight(item.weightValue, item.weightUnit)} · Qty ${item.quantity} · ${money(item.lineTotalMinor, input.currency)}`,
    )
    .join("\n");
  const text = [
    `New MOB GREENS order ${input.reference}`,
    "",
    `Customer: ${input.customerName}`,
    `Email: ${input.customerEmail ?? "Not provided"}`,
    `Fulfillment: ${input.fulfillment === "DELIVERY" ? "Delivery" : "Pickup"}`,
    `Location: ${location}`,
    `Courier: ${input.courierName ?? "Not assigned"}`,
    `Recharge method: ${payment}`,
    `Verification code: ${input.maskedVerificationCode} (masked for email safety)`,
    `Total: ${money(input.totalMinor, input.currency)}`,
    `Submitted: ${input.createdAt.toISOString()}`,
    "",
    "Items",
    itemText,
    "",
    `Review securely: ${input.adminOrderUrl}`,
  ].join("\n");
  const itemRows = input.items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0">${escapeHtml(item.name)}<br><span style="color:#666">${escapeHtml(weight(item.weightValue, item.weightUnit))} · Qty ${item.quantity}</span></td><td style="padding:8px 0;text-align:right">${escapeHtml(money(item.lineTotalMinor, input.currency))}</td></tr>`,
    )
    .join("");
  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#111"><div style="max-width:640px;margin:0 auto;padding:28px 16px"><div style="background:#fff;border:1px solid #ddd;border-radius:16px;padding:28px"><p style="margin:0;color:#666;font-size:13px">MOB GREENS · New order</p><h1 style="margin:8px 0 24px;font-size:26px">${escapeHtml(input.reference)}</h1><table style="width:100%;border-collapse:collapse;font-size:14px"><tr><td style="padding:5px 0;color:#666">Customer</td><td style="padding:5px 0;text-align:right">${escapeHtml(input.customerName)}</td></tr><tr><td style="padding:5px 0;color:#666">Email</td><td style="padding:5px 0;text-align:right">${escapeHtml(input.customerEmail ?? "Not provided")}</td></tr><tr><td style="padding:5px 0;color:#666">Fulfillment</td><td style="padding:5px 0;text-align:right">${input.fulfillment === "DELIVERY" ? "Delivery" : "Pickup"}</td></tr><tr><td style="padding:5px 0;color:#666">Location</td><td style="padding:5px 0;text-align:right">${escapeHtml(location)}</td></tr><tr><td style="padding:5px 0;color:#666">Courier</td><td style="padding:5px 0;text-align:right">${escapeHtml(input.courierName ?? "Not assigned")}</td></tr><tr><td style="padding:5px 0;color:#666">Recharge</td><td style="padding:5px 0;text-align:right">${escapeHtml(payment)}</td></tr></table><div style="margin:22px 0;padding:16px;border-radius:10px;background:#f5f5f5"><div style="font-size:12px;color:#666">Verification code · masked in email</div><div style="margin-top:6px;font-family:monospace;font-size:20px;font-weight:700">${escapeHtml(input.maskedVerificationCode)}</div></div><h2 style="font-size:17px;margin:24px 0 8px">Items</h2><table style="width:100%;border-collapse:collapse;font-size:14px">${itemRows}<tr style="border-top:1px solid #ddd"><td style="padding-top:14px;font-weight:700">Total</td><td style="padding-top:14px;text-align:right;font-weight:700">${escapeHtml(money(input.totalMinor, input.currency))}</td></tr></table><a href="${escapeHtml(input.adminOrderUrl)}" style="display:block;margin-top:24px;padding:13px 18px;border-radius:10px;background:#111;color:#fff;text-decoration:none;text-align:center;font-weight:700">Review order securely</a><p style="margin:16px 0 0;color:#777;font-size:12px">Submitted ${escapeHtml(input.createdAt.toISOString())}. Sign in to reveal the complete code and record an audit event.</p></div></div></body></html>`;
  return {
    subject: `MOB GREENS order ${input.reference} requires verification`,
    text,
    html,
  };
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
  items: Array<{
    name: string;
    weightValue: number;
    weightUnit: WeightUnit;
    quantity: number;
    lineTotalMinor: number;
  }>;
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
  const itemText = input.items
    .map(
      (item) =>
        `- ${item.name} · ${weight(item.weightValue, item.weightUnit)} · Qty ${item.quantity} · ${money(item.lineTotalMinor, input.currency)}`,
    )
    .join("\n");
  const text = [
    `MOB GREENS order ${input.reference}`,
    "",
    `Hello ${input.customerName},`,
    "We received your order for review. Your payment is not confirmed yet.",
    "",
    `Order total: ${money(input.totalMinor, input.currency)}`,
    `Payment method: ${payment}`,
    `Fulfillment: ${fulfillment}`,
    `Destination: ${deliveryDetail}`,
    input.courierName
      ? `Nearby delivery profile: ${input.courierName}`
      : "Delivery profile: pending payment review",
    "",
    "Items",
    itemText,
    "",
    `View your order: ${input.orderUrl}`,
    `View delivery status: ${input.trackingUrl}`,
    "",
    "For your security, verification codes are not included in this email.",
  ].join("\n");
  const itemRows = input.items
    .map(
      (item) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #e7e5e4">${escapeHtml(item.name)}<br><span style="color:#6b7280;font-size:12px">${escapeHtml(weight(item.weightValue, item.weightUnit))} · Qty ${item.quantity}</span></td><td style="padding:10px 0;border-bottom:1px solid #e7e5e4;text-align:right;font-weight:600">${escapeHtml(money(item.lineTotalMinor, input.currency))}</td></tr>`,
    )
    .join("");
  const html = `<!doctype html><html><body style="margin:0;background:#f6f6f4;font-family:Arial,sans-serif;color:#111827"><div style="max-width:640px;margin:0 auto;padding:28px 16px"><div style="overflow:hidden;background:#ffffff;border:1px solid #e7e5e4;border-radius:20px"><div style="padding:26px 28px;background:#101614;color:#ffffff"><img src="${escapeHtml(input.logoUrl)}" width="42" height="42" alt="MOB GREENS" style="display:block;width:42px;height:42px;border-radius:12px;margin:0 0 20px"/><p style="margin:0;color:#bbf7d0;font-size:12px;letter-spacing:.12em;font-weight:700;text-transform:uppercase">Order received</p><h1 style="margin:8px 0 0;font-size:28px;line-height:1.1">${escapeHtml(input.reference)}</h1></div><div style="padding:28px"><p style="margin:0;font-size:16px;line-height:1.6">Hello ${escapeHtml(input.customerName)},</p><p style="margin:12px 0 0;color:#4b5563;font-size:15px;line-height:1.65">We received your order for review. Payment is still pending; we will update your order once it has been verified.</p><div style="margin:24px 0;padding:18px;background:#f3f7f4;border-left:3px solid #15803d"><div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.08em">Order total</div><div style="margin-top:5px;font-size:24px;font-weight:700">${escapeHtml(money(input.totalMinor, input.currency))}</div><div style="margin-top:7px;color:#374151;font-size:14px">${escapeHtml(payment)} · ${escapeHtml(fulfillment)}</div></div><table style="width:100%;border-collapse:collapse;font-size:14px"><tr><td style="padding:6px 0;color:#6b7280">Delivery</td><td style="padding:6px 0;text-align:right">${escapeHtml(deliveryDetail)}</td></tr><tr><td style="padding:6px 0;color:#6b7280">Courier</td><td style="padding:6px 0;text-align:right">${escapeHtml(input.courierName ?? "Pending payment review")}</td></tr></table><h2 style="margin:28px 0 8px;font-size:17px">Your items</h2><table style="width:100%;border-collapse:collapse;font-size:14px">${itemRows}<tr><td style="padding-top:16px;font-weight:700">Total</td><td style="padding-top:16px;text-align:right;font-weight:700">${escapeHtml(money(input.totalMinor, input.currency))}</td></tr></table><a href="${escapeHtml(input.orderUrl)}" style="display:block;margin-top:28px;padding:14px 18px;border-radius:10px;background:#111827;color:#ffffff;text-decoration:none;text-align:center;font-weight:700">View your order</a><a href="${escapeHtml(input.trackingUrl)}" style="display:block;margin-top:10px;padding:13px 18px;border:1px solid #d1d5db;border-radius:10px;color:#111827;text-decoration:none;text-align:center;font-weight:700">View delivery status</a><p style="margin:22px 0 0;color:#6b7280;font-size:12px;line-height:1.55">For your security, verification codes are not included in this email. Submitted ${escapeHtml(input.createdAt.toISOString())}.</p></div></div><p style="margin:16px 0 0;color:#6b7280;text-align:center;font-size:12px">MOB GREENS · ${escapeHtml(input.storefrontUrl)}</p></div></body></html>`;
  return {
    subject: `We received your MOB GREENS order ${input.reference}`,
    text,
    html,
  };
}
