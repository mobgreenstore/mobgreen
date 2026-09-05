import "server-only";

import { randomBytes } from "node:crypto";
import type {
  Currency,
  OrderStatus,
  PaymentStatus,
} from "@/generated/prisma/client";
import type { GuestCheckoutInput } from "@/features/checkout/schema";
import { CartValidationService } from "@/features/cart/server/cart-validation-service";
import { PrismaCartRepository } from "@/features/cart/server/prisma-cart-repository";
import type { GuestSessionIdentity } from "@/server/guest-session";
import { encryptVerificationCode } from "@/features/checkout/server/code-encryption";
import {
  createCustomerOrderNotificationEnvelope,
  createOrderNotificationEnvelope,
  dispatchCustomerOrderSubmittedNotification,
  dispatchOrderSubmittedNotification,
} from "@/features/order-notifications/server/service";
import { prisma } from "@/server/db/client";
import { withTransaction } from "@/server/db/transaction";
import { verifyLocationCandidate } from "@/server/location/verification";

export type CheckoutErrorCode =
  "CART_CHANGED" | "MIXED_CURRENCY" | "INVALID_SELECTION" | "ORDER_FAILED";

export class CheckoutError extends Error {
  constructor(
    readonly code: CheckoutErrorCode,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

export interface CreatedOrderView {
  reference: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: Currency;
  totalMinor: number;
  duplicate: boolean;
}

function createReference() {
  const year = new Date().getUTCFullYear();
  return `MG-${year}-${randomBytes(7).toString("hex").toUpperCase()}`;
}

function publicOrder(
  order: {
    reference: string;
    currency: Currency;
    totalMinor: bigint;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
  },
  duplicate: boolean,
): CreatedOrderView {
  return {
    reference: order.reference,
    status: order.status,
    paymentStatus: order.paymentStatus,
    currency: order.currency,
    totalMinor: Number(order.totalMinor),
    duplicate,
  };
}

export class GuestCheckoutService {
  async create(
    input: GuestCheckoutInput,
    guest: GuestSessionIdentity,
  ): Promise<CreatedOrderView> {
    const encryptedCode = encryptVerificationCode(input.verificationCode);
    const adminNotification = createOrderNotificationEnvelope();
    const customerNotification = createCustomerOrderNotificationEnvelope(
      input.customerEmail,
    );
    const notifications = [
      ...(adminNotification ? [adminNotification] : []),
      ...(customerNotification ? [customerNotification] : []),
    ];
    const verifiedLocation = input.deliveryLocation
      ? verifyLocationCandidate(input.deliveryLocation.verificationToken)
      : null;
    if (input.fulfillmentType === "DELIVERY") {
      const supplied = input.deliveryLocation;
      if (
        !supplied ||
        !verifiedLocation ||
        verifiedLocation.mapboxPlaceId !== supplied.mapboxPlaceId ||
        verifiedLocation.latitude !== supplied.latitude ||
        verifiedLocation.longitude !== supplied.longitude ||
        verifiedLocation.formattedAddress !== supplied.formattedAddress
      ) {
        throw new CheckoutError(
          "INVALID_SELECTION",
          "Confirm the delivery location again.",
          400,
        );
      }
    }

    const result = await withTransaction(async (transaction) => {
      const existing = await transaction.order.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        select: {
          reference: true,
          currency: true,
          totalMinor: true,
          status: true,
          paymentStatus: true,
          guestSession: { select: { tokenHash: true } },
        },
      });
      if (existing) {
        if (existing.guestSession?.tokenHash !== guest.tokenHash) {
          throw new CheckoutError(
            "ORDER_FAILED",
            "The order could not be placed. Try again.",
            409,
          );
        }
        return publicOrder(existing, true);
      }

      const guestSession = await transaction.guestSession.upsert({
        where: { tokenHash: guest.tokenHash },
        create: { tokenHash: guest.tokenHash, expiresAt: guest.expiresAt },
        update: { expiresAt: guest.expiresAt, lastSeenAt: new Date() },
        select: { id: true },
      });

      const authoritativeCart = await new CartValidationService(
        new PrismaCartRepository(transaction),
      ).validate(input.lines);
      if (!authoritativeCart.checkoutEligible) {
        throw new CheckoutError(
          authoritativeCart.hasCurrencyConflict
            ? "MIXED_CURRENCY"
            : "CART_CHANGED",
          authoritativeCart.hasCurrencyConflict
            ? "An order must use one currency."
            : "A product, price, or special offer changed. Review the cart and retry.",
          409,
        );
      }

      const options = await transaction.productPriceOption.findMany({
        where: { id: { in: input.lines.map((line) => line.priceOptionId) } },
        select: {
          id: true,
          productId: true,
          weightValue: true,
          weightUnit: true,
          currency: true,
          priceMinor: true,
          isActive: true,
          archivedAt: true,
          product: {
            select: {
              name: true,
              status: true,
              archivedAt: true,
              category: {
                select: { isActive: true, archivedAt: true },
              },
              images: {
                where: { isCover: true },
                orderBy: { position: "asc" },
                take: 1,
                select: { url: true, altText: true, cloudinaryPublicId: true },
              },
            },
          },
        },
      });
      const byId = new Map(options.map((option) => [option.id, option]));
      const requestedOfferIds = input.lines.flatMap((line) =>
        line.specialOfferId ? [line.specialOfferId] : [],
      );
      const specialOffers = requestedOfferIds.length
        ? await transaction.specialOffer.findMany({
            where: {
              status: "ACTIVE",
              startsAt: { lte: new Date() },
              endsAt: { gt: new Date() },
              archivedAt: null,
              publicId: { in: requestedOfferIds },
            },
            select: {
              id: true,
              publicId: true,
              productId: true,
              priceOptionId: true,
              bundleQuantity: true,
              totalWeightGrams: true,
              originalTotalMinor: true,
              discountBps: true,
              discountMinor: true,
              offerTotalMinor: true,
              endsAt: true,
            },
          })
        : [];
      const offersByPublicId = new Map(
        specialOffers.map((offer) => [offer.publicId, offer]),
      );

      const snapshots = input.lines.map((line) => {
        const option = byId.get(line.priceOptionId);
        if (!option || option.productId !== line.productId) {
          throw new CheckoutError(
            "INVALID_SELECTION",
            "A cart selection is no longer valid.",
            409,
          );
        }
        const available =
          option.isActive &&
          option.archivedAt === null &&
          option.product.status === "ACTIVE" &&
          option.product.archivedAt === null &&
          option.product.category.isActive &&
          option.product.category.archivedAt === null;
        if (!available) {
          throw new CheckoutError(
            "CART_CHANGED",
            "A product or price option is no longer available.",
            409,
          );
        }
        const offer = line.specialOfferId
          ? offersByPublicId.get(line.specialOfferId)
          : null;
        if (
          line.specialOfferId &&
          (!offer ||
            offer.productId !== line.productId ||
            offer.priceOptionId !== line.priceOptionId)
        ) {
          throw new CheckoutError(
            "CART_CHANGED",
            "A special offer changed or expired. Review the cart and retry.",
            409,
          );
        }
        const unitPriceMinor = offer?.offerTotalMinor ?? option.priceMinor;
        return {
          productId: line.productId,
          priceOptionId: line.priceOptionId,
          specialOfferId: offer?.id ?? null,
          productNameSnapshot: option.product.name,
          productImageUrlSnapshot: option.product.images?.[0]?.url ?? null,
          productImageAltTextSnapshot:
            option.product.images?.[0]?.altText ?? null,
          productImagePublicIdSnapshot:
            option.product.images?.[0]?.cloudinaryPublicId ?? null,
          weightValueSnapshot: offer?.totalWeightGrams ?? option.weightValue,
          weightUnitSnapshot: offer ? "G" : option.weightUnit,
          currencySnapshot: option.currency,
          unitPriceMinor,
          quantity: line.quantity,
          lineTotalMinor: unitPriceMinor * BigInt(line.quantity),
          offerOriginalTotalMinorSnapshot: offer?.originalTotalMinor ?? null,
          offerDiscountBpsSnapshot: offer?.discountBps ?? null,
          offerDiscountMinorSnapshot: offer?.discountMinor ?? null,
          offerTotalMinorSnapshot: offer?.offerTotalMinor ?? null,
          offerBundleQuantitySnapshot: offer?.bundleQuantity ?? null,
          offerEndsAtSnapshot: offer?.endsAt ?? null,
        };
      });

      const currencies = new Set(
        snapshots.map((item) => item.currencySnapshot),
      );
      if (currencies.size !== 1) {
        throw new CheckoutError(
          "MIXED_CURRENCY",
          "An order must use one currency. Remove items in other currencies.",
          409,
        );
      }
      const currency = snapshots[0]?.currencySnapshot;
      if (!currency) {
        throw new CheckoutError("INVALID_SELECTION", "The cart is empty.", 400);
      }
      const subtotalMinor = snapshots.reduce(
        (total, item) => total + item.lineTotalMinor,
        0n,
      );
      if (
        subtotalMinor < 0n ||
        subtotalMinor > BigInt(Number.MAX_SAFE_INTEGER)
      ) {
        throw new CheckoutError(
          "ORDER_FAILED",
          "The order total could not be calculated.",
          400,
        );
      }

      const order = await transaction.order.create({
        data: {
          reference: createReference(),
          idempotencyKey: input.idempotencyKey,
          guestSessionId: guestSession.id,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: null,
          fulfillmentType: input.fulfillmentType,
          deliveryAddress: verifiedLocation?.formattedAddress ?? null,
          deliveryPostalCode: verifiedLocation?.postalCode || null,
          deliveryLocality: verifiedLocation?.locality || null,
          deliveryCountryCode: verifiedLocation?.countryCode ?? null,
          destinationLatitude: verifiedLocation?.latitude ?? null,
          destinationLongitude: verifiedLocation?.longitude ?? null,
          destinationMapboxPlaceId: verifiedLocation?.mapboxPlaceId ?? null,
          customerNote: input.customerNote || null,
          currency,
          subtotalMinor,
          deliveryFeeMinor: 0n,
          totalMinor: subtotalMinor,
          status: "CONFIRMED",
          paymentStatus: "PAID",
          paymentMethod: input.paymentMethod,
          rechargeProvider:
            input.paymentMethod === "RECHARGE_ONLINE"
              ? (input.rechargeProvider ?? null)
              : null,
          verificationCodeEncrypted: encryptedCode,
          items: { create: snapshots },
          statusEvents: {
            create: {
              toStatus: "CONFIRMED",
              note: "Order confirmed automatically after recharge code submission.",
            },
          },
          paymentStatusEvents: {
            create: {
              toStatus: "PAID",
              note: "Recharge code submitted at checkout; payment was automatically confirmed.",
            },
          },
          ...(notifications.length
            ? { notifications: { create: notifications } }
            : {}),
        },
        select: {
          reference: true,
          currency: true,
          totalMinor: true,
          status: true,
          paymentStatus: true,
        },
      });

      return publicOrder(order, false);
    });
    await Promise.all([
      dispatchOrderSubmittedNotification(result.reference),
      dispatchCustomerOrderSubmittedNotification(result.reference),
    ]);
    return result;
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    return prisma.order.findUnique({
      where: { idempotencyKey },
      select: {
        reference: true,
        currency: true,
        totalMinor: true,
        status: true,
        paymentStatus: true,
      },
    });
  }
}
