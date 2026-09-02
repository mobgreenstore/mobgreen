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
  const payment = paymentMethodLabel(input.paymentMethod, input.rechargeProvider);
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
    `Phone: ${input.customerPhone ?? "Not provided"}`,
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
  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#111"><div style="max-width:640px;margin:0 auto;padding:28px 16px"><div style="background:#fff;border:1px solid #ddd;border-radius:16px;padding:28px"><p style="margin:0;color:#666;font-size:13px">MOB GREENS · New order</p><h1 style="margin:8px 0 24px;font-size:26px">${escapeHtml(input.reference)}</h1><table style="width:100%;border-collapse:collapse;font-size:14px"><tr><td style="padding:5px 0;color:#666">Customer</td><td style="padding:5px 0;text-align:right">${escapeHtml(input.customerName)}</td></tr><tr><td style="padding:5px 0;color:#666">Email</td><td style="padding:5px 0;text-align:right">${escapeHtml(input.customerEmail ?? "Not provided")}</td></tr><tr><td style="padding:5px 0;color:#666">Phone</td><td style="padding:5px 0;text-align:right">${escapeHtml(input.customerPhone ?? "Not provided")}</td></tr><tr><td style="padding:5px 0;color:#666">Fulfillment</td><td style="padding:5px 0;text-align:right">${input.fulfillment === "DELIVERY" ? "Delivery" : "Pickup"}</td></tr><tr><td style="padding:5px 0;color:#666">Location</td><td style="padding:5px 0;text-align:right">${escapeHtml(location)}</td></tr><tr><td style="padding:5px 0;color:#666">Courier</td><td style="padding:5px 0;text-align:right">${escapeHtml(input.courierName ?? "Not assigned")}</td></tr><tr><td style="padding:5px 0;color:#666">Recharge</td><td style="padding:5px 0;text-align:right">${escapeHtml(payment)}</td></tr></table><div style="margin:22px 0;padding:16px;border-radius:10px;background:#f5f5f5"><div style="font-size:12px;color:#666">Verification code · masked in email</div><div style="margin-top:6px;font-family:monospace;font-size:20px;font-weight:700">${escapeHtml(input.maskedVerificationCode)}</div></div><h2 style="font-size:17px;margin:24px 0 8px">Items</h2><table style="width:100%;border-collapse:collapse;font-size:14px">${itemRows}<tr style="border-top:1px solid #ddd"><td style="padding-top:14px;font-weight:700">Total</td><td style="padding-top:14px;text-align:right;font-weight:700">${escapeHtml(money(input.totalMinor, input.currency))}</td></tr></table><a href="${escapeHtml(input.adminOrderUrl)}" style="display:block;margin-top:24px;padding:13px 18px;border-radius:10px;background:#111;color:#fff;text-decoration:none;text-align:center;font-weight:700">Review order securely</a><p style="margin:16px 0 0;color:#777;font-size:12px">Submitted ${escapeHtml(input.createdAt.toISOString())}. Sign in to reveal the complete code and record an audit event.</p></div></div></body></html>`;
  return {
    subject: `MOB GREENS order ${input.reference} requires verification`,
    text,
    html,
  };
}
