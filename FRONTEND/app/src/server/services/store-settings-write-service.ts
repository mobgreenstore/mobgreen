import { executeWrite } from "@/server/core/write-boundary";
import type { StoreSettingsRepository } from "@/server/repositories/contracts";
import { PrismaStoreSettingsRepository } from "@/server/repositories/prisma";
import { updateStoreSettingsSchema } from "@/server/validation";

export class StoreSettingsWriteService {
  constructor(
    private readonly repository: StoreSettingsRepository = new PrismaStoreSettingsRepository(),
  ) {}
  update(input: unknown) {
    return executeWrite(
      "storeSettings.update",
      updateStoreSettingsSchema,
      input,
      (data) => this.repository.upsert(data),
    );
  }
}
