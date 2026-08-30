import { z } from "zod";
import {
  currencySchema,
  optionalTrimmedString,
} from "@/server/validation/common";

export const updateStoreSettingsSchema = z.object({
  storeName: z.string().trim().min(2).max(120),
  supportPhone: optionalTrimmedString(40),
  supportedCurrencyCodes: z.array(currencySchema).min(1).max(3),
  orderPrefix: z
    .string()
    .trim()
    .toUpperCase()
    .min(1)
    .max(10)
    .regex(/^[A-Z0-9]+$/),
  pickupInstructions: optionalTrimmedString(5_000),
  deliveryEnabled: z.boolean(),
});
