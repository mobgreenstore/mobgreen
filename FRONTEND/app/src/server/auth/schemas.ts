import { z } from "zod";

export const adminEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email().max(320));

export const adminPasswordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128, "Use no more than 128 characters.");

export const adminSignInSchema = z.object({
  email: adminEmailSchema,
  password: z.string().min(1).max(128),
});

export const adminBootstrapSchema = z.object({
  email: adminEmailSchema,
  password: adminPasswordSchema,
  name: z.string().trim().min(2).max(120),
});
