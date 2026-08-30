import { z } from "zod";
import { idSchema } from "@/server/validation/common";

export const createAdminUserSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(320)),
  passwordHash: z.string().min(20).max(255),
  name: z.string().trim().min(2).max(120),
  isActive: z.boolean().default(true),
  role: z.enum(["OWNER", "MANAGER", "EDITOR", "VIEWER"]).default("VIEWER"),
});

export const setAdminUserActiveSchema = z.object({
  id: idSchema,
  isActive: z.boolean(),
});
