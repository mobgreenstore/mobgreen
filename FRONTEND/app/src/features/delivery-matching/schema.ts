import { z } from "zod";
import { RECHARGE_PARTNERS } from "@/config/recharge";
import { storedCartLinesSchema } from "@/features/cart/schema";
import { deliveryLocationSchema } from "@/features/location/schema";
import { PAYMENT_METHODS } from "@/features/payments/payment-method";

const partnerIds = RECHARGE_PARTNERS.map((partner) => partner.id) as [
  (typeof RECHARGE_PARTNERS)[number]["id"],
  ...(typeof RECHARGE_PARTNERS)[number]["id"][],
];

export const checkoutIntentIdSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{32}$/, "Invalid checkout reference.");

export const startCheckoutIntentSchema = z
  .object({
    idempotencyKey: z.uuid(),
    customerName: z.string().trim().min(2).max(120),
    customerEmail: z.email().trim().toLowerCase().max(320),
    fulfillmentType: z.enum(["PICKUP", "DELIVERY"]),
    paymentMethod: z.enum(PAYMENT_METHODS),
    rechargeProvider: z.enum(partnerIds).nullable().optional(),
    deliveryLocation: deliveryLocationSchema.nullable().optional(),
    lines: storedCartLinesSchema.min(1),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.fulfillmentType === "PICKUP" && value.deliveryLocation) {
      context.addIssue({
        code: "custom",
        path: ["deliveryLocation"],
        message: "Pickup orders do not use a delivery location.",
      });
    }
    if (value.paymentMethod === "RECHARGE_ONLINE" && !value.rechargeProvider) {
      context.addIssue({
        code: "custom",
        path: ["rechargeProvider"],
        message: "Choose the online partner used for the recharge.",
      });
    }
    if (value.paymentMethod !== "RECHARGE_ONLINE" && value.rechargeProvider) {
      context.addIssue({
        code: "custom",
        path: ["rechargeProvider"],
        message: "A partner is only used for online recharge.",
      });
    }
  });

export const selectCourierSchema = z
  .object({
    intentId: checkoutIntentIdSchema,
    courierCandidateId: z
      .string()
      .trim()
      .min(20)
      .max(64)
      .regex(new RegExp("^[A-Za-z0-9_-]+$")),
  })
  .strict();

export const updateIntentLocationSchema = z
  .object({
    intentId: checkoutIntentIdSchema,
    deliveryLocation: deliveryLocationSchema,
  })
  .strict();

export const finalizeCheckoutSchema = z
  .object({
    intentId: checkoutIntentIdSchema,
    verificationCode: z
      .string()
      .trim()
      .min(1, "Enter the recharge verification code.")
      .max(64)
      .regex(/^\d+$/, "The verification code must contain digits only."),
    customerNote: z.string().trim().max(1000).optional(),
  })
  .strict();

export type StartCheckoutIntentInput = z.output<
  typeof startCheckoutIntentSchema
>;
export type SelectCourierInput = z.output<typeof selectCourierSchema>;
export type UpdateIntentLocationInput = z.output<
  typeof updateIntentLocationSchema
>;
export type FinalizeCheckoutInput = z.output<typeof finalizeCheckoutSchema>;
