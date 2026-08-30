import "server-only";

import { z } from "zod";

const authEnvironmentSchema = z.object({
  SESSION_SECRET: z.string().min(32),
});

export function getSessionSecret() {
  return authEnvironmentSchema.parse({
    SESSION_SECRET: process.env.SESSION_SECRET,
  }).SESSION_SECRET;
}
