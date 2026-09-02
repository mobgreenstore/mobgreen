import { z } from "zod";
import { PAYMENT_METHODS } from "@/features/payments/payment-method";
import {
  currencySchema,
  idSchema,
  moneyMinorSchema,
  optionalTrimmedString,
  weightUnitSchema,
} from "@/server/validation/common";

export const orderItemWriteSchema = z.object({
  productId: idSchema.optional(),
  priceOptionId: idSchema.optional(),
  productNameSnapshot: z.string().trim().min(1).max(160),
  weightValueSnapshot: z.coerce.number().positive(),
  weightUnitSnapshot: weightUnitSchema,
  currencySnapshot: currencySchema,
  unitPriceMinor: moneyMinorSchema,
  quantity: z.number().int().positive().max(999),
  lineTotalMinor: moneyMinorSchema,
});

export const createOrderSchema = z
  .object({
    reference: z
      .string()
      .trim()
      .min(6)
      .max(32)
      .regex(/^[A-Z0-9-]+$/),
    customerName: z.string().trim().min(2).max(120),
    customerPhone: z.string().trim().min(6).max(40),
    customerEmail: z
      .union([z.email().trim().toLowerCase().max(320), z.literal("")])
      .optional()
      .transform((value) => value || undefined),
    fulfillmentType: z.enum(["PICKUP", "DELIVERY"]),
    deliveryAddress: optionalTrimmedString(2_000),
    customerNote: optionalTrimmedString(1_000),
    currency: currencySchema,
    subtotalMinor: moneyMinorSchema,
    deliveryFeeMinor: moneyMinorSchema.default(0n),
    totalMinor: moneyMinorSchema,
    paymentMethod: z.enum(PAYMENT_METHODS),
    items: z.array(orderItemWriteSchema).min(1).max(100),
  })
  .superRefine((value, context) => {
    if (value.fulfillmentType === "DELIVERY" && !value.deliveryAddress) {
      context.addIssue({
        code: "custom",
        message: "A delivery address is required.",
        path: ["deliveryAddress"],
      });
    }
    if (value.totalMinor !== value.subtotalMinor + value.deliveryFeeMinor) {
      context.addIssue({
        code: "custom",
        message: "The order total is inconsistent.",
        path: ["totalMinor"],
      });
    }
    value.items.forEach((item, index) => {
      if (item.currencySnapshot !== value.currency) {
        context.addIssue({
          code: "custom",
          message: "Mixed-currency orders are not supported.",
          path: ["items", index, "currencySnapshot"],
        });
      }
      if (item.lineTotalMinor !== item.unitPriceMinor * BigInt(item.quantity)) {
        context.addIssue({
          code: "custom",
          message: "The line total is inconsistent.",
          path: ["items", index, "lineTotalMinor"],
        });
      }
    });
  });

export const updateOrderStatusSchema = z.object({
  orderId: idSchema,
  fromStatus: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "READY",
    "OUT_FOR_DELIVERY",
    "COMPLETED",
    "CANCELLED",
  ]),
  toStatus: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "READY",
    "OUT_FOR_DELIVERY",
    "COMPLETED",
    "CANCELLED",
  ]),
  changedByAdminId: idSchema,
  note: optionalTrimmedString(1_000),
});
