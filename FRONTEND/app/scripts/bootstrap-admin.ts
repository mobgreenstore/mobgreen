import { loadEnvConfig } from "@next/env";
import { z } from "zod";

loadEnvConfig(process.cwd());

const bootstrapEnvironmentSchema = z.object({
  ADMIN_BOOTSTRAP_EMAIL: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email().max(320)),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(12).max(128),
  ADMIN_BOOTSTRAP_NAME: z.string().trim().min(2).max(120),
});

async function main() {
  const environment = bootstrapEnvironmentSchema.parse(process.env);
  const [{ prisma }, { hashPassword }] = await Promise.all([
    import("../src/server/db/client"),
    import("../src/server/auth/password"),
  ]);

  try {
    await prisma.$transaction(async (transaction) => {
      if ((await transaction.adminUser.count()) > 0) {
        throw new Error("ADMIN_ALREADY_EXISTS");
      }
      await transaction.adminUser.create({
        data: {
          email: environment.ADMIN_BOOTSTRAP_EMAIL,
          name: environment.ADMIN_BOOTSTRAP_NAME,
          role: "OWNER",
          passwordHash: await hashPassword(
            environment.ADMIN_BOOTSTRAP_PASSWORD,
          ),
        },
      });
    });
    console.log("The first MOB GREENS administrator was created.");
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_ALREADY_EXISTS") {
      console.error("Bootstrap stopped: an administrator already exists.");
    } else {
      console.error("Administrator bootstrap failed.");
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
