import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/client";
import type { DatabaseClient } from "@/server/db/transaction";
import type {
  StoreSettingsRepository,
  UpdateStoreSettingsInput,
} from "@/server/repositories/contracts";

function settingsData(
  input: UpdateStoreSettingsInput,
): Prisma.StoreSettingsUncheckedCreateInput {
  return {
    id: "default",
    storeName: input.storeName,
    supportPhone: input.supportPhone ?? null,
    supportedCurrencyCodes: input.supportedCurrencyCodes,
    orderPrefix: input.orderPrefix,
    pickupInstructions: input.pickupInstructions ?? null,
    deliveryEnabled: input.deliveryEnabled,
  };
}

export class PrismaStoreSettingsRepository implements StoreSettingsRepository {
  constructor(private readonly database: DatabaseClient = prisma) {}
  get() {
    return this.database.storeSettings.findUnique({ where: { id: "default" } });
  }
  upsert(input: UpdateStoreSettingsInput) {
    const data = settingsData(input);
    const update: Prisma.StoreSettingsUncheckedUpdateInput = {
      storeName: input.storeName,
      supportPhone: input.supportPhone ?? null,
      supportedCurrencyCodes: input.supportedCurrencyCodes,
      orderPrefix: input.orderPrefix,
      pickupInstructions: input.pickupInstructions ?? null,
      deliveryEnabled: input.deliveryEnabled,
    };
    return this.database.storeSettings.upsert({
      where: { id: "default" },
      create: data,
      update,
    });
  }
}
