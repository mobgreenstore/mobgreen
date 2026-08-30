import type {
  AdminUserRepository,
  CreateAdminUserInput,
} from "@/server/repositories/contracts";
import type { DatabaseClient } from "@/server/db/transaction";
import { prisma } from "@/server/db/client";

export class PrismaAdminUserRepository implements AdminUserRepository {
  constructor(private readonly database: DatabaseClient = prisma) {}
  findById(id: string) {
    return this.database.adminUser.findUnique({ where: { id } });
  }
  findByEmail(email: string) {
    return this.database.adminUser.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }
  create(input: CreateAdminUserInput) {
    return this.database.adminUser.create({ data: input });
  }
  setActive(id: string, isActive: boolean) {
    return this.database.adminUser.update({
      where: { id },
      data: { isActive, sessionVersion: { increment: 1 } },
    });
  }
  recordSuccessfulLogin(id: string) {
    return this.database.adminUser.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
