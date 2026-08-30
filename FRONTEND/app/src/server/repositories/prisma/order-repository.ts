import { OrderStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/client";
import { withTransaction, type DatabaseClient } from "@/server/db/transaction";
import type {
  CreateOrderInput,
  OrderRepository,
  UpdateOrderStatusInput,
} from "@/server/repositories/contracts";

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly database: DatabaseClient = prisma) {}
  findById(id: string) {
    return this.database.order.findUnique({
      where: { id },
      include: { items: true, statusEvents: { orderBy: { createdAt: "asc" } } },
    });
  }
  findByReference(reference: string) {
    return this.database.order.findUnique({
      where: { reference },
      include: { items: true, statusEvents: { orderBy: { createdAt: "asc" } } },
    });
  }
  create({ items, ...input }: CreateOrderInput) {
    const data: Prisma.OrderUncheckedCreateInput = {
      reference: input.reference,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail ?? null,
      fulfillmentType: input.fulfillmentType,
      deliveryAddress: input.deliveryAddress ?? null,
      customerNote: input.customerNote ?? null,
      currency: input.currency,
      subtotalMinor: input.subtotalMinor,
      deliveryFeeMinor: input.deliveryFeeMinor,
      totalMinor: input.totalMinor,
      status: OrderStatus.PENDING,
      paymentMethod: input.paymentMethod,
      items: {
        create: items.map((item) => ({
          productId: item.productId ?? null,
          priceOptionId: item.priceOptionId ?? null,
          productNameSnapshot: item.productNameSnapshot,
          weightValueSnapshot: item.weightValueSnapshot.toString(),
          weightUnitSnapshot: item.weightUnitSnapshot,
          currencySnapshot: item.currencySnapshot,
          unitPriceMinor: item.unitPriceMinor,
          quantity: item.quantity,
          lineTotalMinor: item.lineTotalMinor,
        })),
      },
      statusEvents: { create: { toStatus: OrderStatus.PENDING } },
    };
    return this.database.order.create({ data });
  }
  updateStatus(input: UpdateOrderStatusInput) {
    return withTransaction(async (transaction) => {
      const updated = await transaction.order.updateMany({
        where: { id: input.orderId, status: input.fromStatus },
        data: { status: input.toStatus },
      });
      if (updated.count !== 1) throw new Error("ORDER_STATUS_CONFLICT");
      const [order, event] = await Promise.all([
        transaction.order.findUniqueOrThrow({ where: { id: input.orderId } }),
        transaction.orderStatusEvent.create({
          data: {
            orderId: input.orderId,
            fromStatus: input.fromStatus,
            toStatus: input.toStatus,
            changedByAdminId: input.changedByAdminId,
            note: input.note ?? null,
          },
        }),
      ]);
      return { order, event };
    });
  }
}
