import { executeWrite } from "@/server/core/write-boundary";
import type { OrderRepository } from "@/server/repositories/contracts";
import { PrismaOrderRepository } from "@/server/repositories/prisma";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "@/server/validation";

export class OrderWriteService {
  constructor(
    private readonly repository: OrderRepository = new PrismaOrderRepository(),
  ) {}
  create(input: unknown) {
    return executeWrite("order.create", createOrderSchema, input, (data) =>
      this.repository.create(data),
    );
  }
  updateStatus(input: unknown) {
    return executeWrite(
      "order.updateStatus",
      updateOrderStatusSchema,
      input,
      (data) => this.repository.updateStatus(data),
    );
  }
}
