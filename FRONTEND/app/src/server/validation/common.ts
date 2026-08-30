import { z } from "zod";

export const idSchema = z.uuid();
export const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(180)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and hyphens only.",
  );
export const currencySchema = z.enum(["GBP", "EUR", "USD"]);
export const weightUnitSchema = z.enum(["G", "KG"]);
export const moneyMinorSchema = z.coerce
  .bigint()
  .nonnegative()
  .max(BigInt(Number.MAX_SAFE_INTEGER));
export const optionalTrimmedString = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .optional()
    .transform((value) => value || undefined);
