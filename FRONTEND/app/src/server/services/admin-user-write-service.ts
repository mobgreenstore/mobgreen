import { executeWrite } from "@/server/core/write-boundary";
import type { AdminUserRepository } from "@/server/repositories/contracts";
import { PrismaAdminUserRepository } from "@/server/repositories/prisma";
import {
  createAdminUserSchema,
  setAdminUserActiveSchema,
} from "@/server/validation";

export class AdminUserWriteService {
  constructor(
    private readonly repository: AdminUserRepository = new PrismaAdminUserRepository(),
  ) {}
  create(input: unknown) {
    return executeWrite(
      "adminUser.create",
      createAdminUserSchema,
      input,
      (data) => this.repository.create(data),
    );
  }
  setActive(input: unknown) {
    return executeWrite(
      "adminUser.setActive",
      setAdminUserActiveSchema,
      input,
      ({ id, isActive }) => this.repository.setActive(id, isActive),
    );
  }
}
