import "server-only";

import { logger } from "@/server/core/logger";
import { failure, success, type Result } from "@/server/core/result";
import { PrismaAdminUserRepository } from "@/server/repositories/prisma";
import type { AdminUserRepository } from "@/server/repositories/contracts";
import { adminSignInSchema } from "@/server/auth/schemas";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import {
  clearLoginFailures,
  createLoginThrottleKey,
  isLoginRateLimited,
  recordLoginFailure,
} from "@/server/auth/rate-limit";

export const GENERIC_AUTH_ERROR = "Email or password is incorrect.";

const dummyPasswordHash = hashPassword("mob-greens-dummy-password-value");

export interface AuthenticationSuccess {
  adminId: string;
  sessionVersion: number;
}

export class AdminAuthenticationService {
  constructor(
    private readonly repository: AdminUserRepository = new PrismaAdminUserRepository(),
  ) {}

  async authenticate(
    input: unknown,
    clientAddress: string,
  ): Promise<Result<AuthenticationSuccess>> {
    const parsed = adminSignInSchema.safeParse(input);
    if (!parsed.success) {
      await verifyPassword("invalid", await dummyPasswordHash);
      return failure({ code: "UNAUTHORIZED", message: GENERIC_AUTH_ERROR });
    }

    const keyHash = createLoginThrottleKey(parsed.data.email, clientAddress);

    try {
      if (await isLoginRateLimited(keyHash)) {
        await verifyPassword(parsed.data.password, await dummyPasswordHash);
        return failure({ code: "UNAUTHORIZED", message: GENERIC_AUTH_ERROR });
      }

      const admin = await this.repository.findByEmail(parsed.data.email);
      const passwordMatches = await verifyPassword(
        parsed.data.password,
        admin?.passwordHash ?? (await dummyPasswordHash),
      );

      if (!admin?.isActive || !passwordMatches) {
        await recordLoginFailure(keyHash);
        return failure({ code: "UNAUTHORIZED", message: GENERIC_AUTH_ERROR });
      }

      await clearLoginFailures(keyHash);
      const updated = await this.repository.recordSuccessfulLogin(admin.id);
      return success({
        adminId: updated.id,
        sessionVersion: updated.sessionVersion,
      });
    } catch (error) {
      logger.error("Admin authentication failed", { error });
      return failure({ code: "UNAUTHORIZED", message: GENERIC_AUTH_ERROR });
    }
  }
}
