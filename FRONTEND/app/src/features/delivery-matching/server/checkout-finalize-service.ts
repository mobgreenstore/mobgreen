import "server-only";

import { randomBytes } from "node:crypto";
import type {
  Currency,
  OrderStatus,
  PaymentStatus,
} from "@/generated/prisma/client";
import { CartValidationService } from "@/features/cart/server/cart-validation-service";
import { PrismaCartRepository } from "@/features/cart/server/prisma-cart-repository";
import type { FinalizeCheckoutInput } from "@/features/delivery-matching/schema";
import { parseIntentCartLines } from "@/features/delivery-matching/server/checkout-intent-service";
import {
  encryptVerificationCode,
  fingerprintVerificationCode,
} from "@/features/checkout/server/code-encryption";
import { maskVerificationCode } from "@/features/order-notifications/server/template";
import {
  createCustomerOrderNotificationEnvelope,
  createOrderNotificationEnvelope,
  dispatchCustomerOrderSubmittedNotification,
  dispatchOrderSubmittedNotification,
} from "@/features/order-notifications/server/service";
import {
  CheckoutError,
  type CreatedOrderView,
} from "@/features/checkout/server/guest-checkout-service";
import { withTransaction } from "@/server/db/transaction";

interface GuestSessionReference {
  id: string;
  tokenHash: string;
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

export class CheckoutFinalizeService {
  async createFromIntent(
    input: FinalizeCheckoutInput,
    guest: GuestSessionReference,
  ): Promise<CreatedOrderView> {
    const securedCodes = input.verificationCodes.map((code, position) => ({
      encryptedValue: encryptVerificationCode(code),
      fingerprint: fingerprintVerificationCode(code),
      maskedValue: maskVerificationCode(code),
      position,
    }));
    const encryptedCode = securedCodes[0]?.encryptedValue ?? null;
    const adminNotification = createOrderNotificationEnvelope();

    const result = await withTransaction(async (transaction) => {
      const intent = await transaction.checkoutIntent.findFirst({
        where: { publicId: input.intentId, guestSessionId: guest.id },
        select: {
          id: true,
          publicId: true,
          idempotencyKey: true,
          status: true,
          customerName: true,
          customerEmail: true,
          fulfillmentType: true,
          paymentMethod: true,
          rechargeProvider: true,
          cartLines: true,
          currency: true,
          subtotalMinor: true,
          deliveryAddress: true,
          deliveryPostalCode: true,
          deliveryLocality: true,
          deliveryCountryCode: true,
          destinationLatitude: true,
          destinationLongitude: true,
          destinationMapboxPlaceId: true,
          selectedCourierProfileId: true,
          selectedCourierName: true,
          selectedDistanceMeters: true,
          selectedDurationSeconds: true,
          expiresAt: true,
          order: {
            select: {
              id: true,
              reference: true,
              currency: true,
              totalMinor: true,
              status: true,
              paymentStatus: true,
            },
          },
        },
      });

      if (!intent) {
        throw new CheckoutError(
          "ORDER_FAILED",
          "The checkout could not be continued. Start checkout again.",
          404,
        );
      }
      if (intent.order) return publicOrder(intent.order, true);
      if (intent.paymentMethod === "BITCOIN_DEPOSIT") {
        throw new CheckoutError(
          "INVALID_SELECTION",
          "Bitcoin payment must be confirmed by the invoice service.",
          400,
        );
      }
      if (intent.expiresAt <= new Date() || intent.status === "EXPIRED") {
        await transaction.checkoutIntent.update({
          where: { id: intent.id },
          data: { status: "EXPIRED" },
        });
        throw new CheckoutError(
          "ORDER_FAILED",
          "This checkout has expired. Return to checkout and try again.",
          410,
        );
      }
      if (intent.status === "SUBMITTED") {
        throw new CheckoutError(
          "INVALID_SELECTION",
          "This payment has already been submitted.",
          400,
        );
      }
      if (
        intent.fulfillmentType === "DELIVERY" &&
        (!intent.deliveryAddress ||
          intent.destinationLatitude === null ||
          intent.destinationLongitude === null)
      ) {
        throw new CheckoutError(
          "INVALID_SELECTION",
          "Confirm a delivery location before submitting payment.",
          400,
        );
      }
      if (
        intent.fulfillmentType === "DELIVERY" &&
        (!intent.selectedCourierProfileId ||
          !intent.selectedCourierName ||
          intent.selectedDistanceMeters === null ||
          intent.selectedDurationSeconds === null)
      ) {
        throw new CheckoutError(
          "INVALID_SELECTION",
          "Choose a nearby delivery profile before submitting payment.",
          400,
        );
      }

      const existing = await transaction.order.findUnique({
        where: { idempotencyKey: intent.idempotencyKey },
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

      const lines = parseIntentCartLines(intent.cartLines);
      const authoritativeCart = await new CartValidationService(
        new PrismaCartRepository(transaction),
      ).validate(lines);
      if (
        !authoritativeCart.checkoutEligible ||
        authoritativeCart.currency !== intent.currency ||
        authoritativeCart.subtotalMinor === null ||
        BigInt(authoritativeCart.subtotalMinor) !== intent.subtotalMinor
      ) {
        throw new CheckoutError(
          "CART_CHANGED",
          "A product, price, or special offer changed. Review the card and retry.",
          409,
        );
      }
      const options = await transaction.productPriceOption.findMany({
        where: { id: { in: lines.map((line) => line.priceOptionId) } },
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
              category: { select: { isActive: true, archivedAt: true } },
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
      const requestedOfferIds = lines.flatMap((line) =>
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
      const snapshots = lines.map((line) => {
        const option = byId.get(line.priceOptionId);
        if (!option || option.productId !== line.productId) {
          throw new CheckoutError(
            "INVALID_SELECTION",
            "A card selection is no longer valid.",
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
            "A special offer changed or expired. Review the card and retry.",
            409,
          );
        }
        const unitPriceMinor = offer?.offerTotalMinor ?? option.priceMinor;
        return {
          productId: line.productId,
          priceOptionId: line.priceOptionId,
          specialOfferId: offer?.id ?? null,
          productNameSnapshot: option.product.name,
          productImageUrlSnapshot: option.product.images[0]?.url ?? null,
          productImageAltTextSnapshot:
            option.product.images[0]?.altText ?? null,
          productImagePublicIdSnapshot:
            option.product.images[0]?.cloudinaryPublicId ?? null,
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
      if (
        currencies.size !== 1 ||
        snapshots[0]?.currencySnapshot !== intent.currency
      ) {
        throw new CheckoutError(
          "MIXED_CURRENCY",
          "An order must use one currency. Review the card and retry.",
          409,
        );
      }
      const subtotalMinor = snapshots.reduce(
        (total, item) => total + item.lineTotalMinor,
        0n,
      );
      if (subtotalMinor !== intent.subtotalMinor) {
        throw new CheckoutError(
          "CART_CHANGED",
          "A product or price changed. Review the card and retry.",
          409,
        );
      }

      const customerNotification = createCustomerOrderNotificationEnvelope(
        intent.customerEmail,
      );
      const notifications = [
        ...(adminNotification ? [adminNotification] : []),
        ...(customerNotification ? [customerNotification] : []),
      ];

      const order = await transaction.order.create({
        data: {
          reference: createReference(),
          idempotencyKey: intent.idempotencyKey,
          guestSessionId: guest.id,
          checkoutIntentId: intent.id,
          customerName: intent.customerName,
          customerEmail: intent.customerEmail,
          customerPhone: null,
          fulfillmentType: intent.fulfillmentType,
          deliveryAddress: intent.deliveryAddress,
          deliveryPostalCode: intent.deliveryPostalCode,
          deliveryLocality: intent.deliveryLocality,
          deliveryCountryCode: intent.deliveryCountryCode,
          destinationLatitude: intent.destinationLatitude,
          destinationLongitude: intent.destinationLongitude,
          destinationMapboxPlaceId: intent.destinationMapboxPlaceId,
          courierProfileIdSnapshot: intent.selectedCourierProfileId,
          courierNameSnapshot: intent.selectedCourierName,
          courierDistanceMeters: intent.selectedDistanceMeters,
          courierDurationSeconds: intent.selectedDurationSeconds,
          customerNote: input.customerNote || null,
          currency: intent.currency,
          subtotalMinor,
          deliveryFeeMinor: 0n,
          totalMinor: subtotalMinor,
          status: "CONFIRMED",
          paymentStatus: "PAID",
          paymentMethod: intent.paymentMethod,
          rechargeProvider: intent.rechargeProvider,
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
          id: true,
          reference: true,
          currency: true,
          totalMinor: true,
          status: true,
          paymentStatus: true,
        },
      });

      await transaction.paymentAttempt.create({
        data: {
          publicId: randomBytes(24).toString("base64url"),
          checkoutIntentId: intent.id,
          orderId: order.id,
          paymentMethod: intent.paymentMethod,
          provider: "INTERNAL_RECHARGE",
          currency: intent.currency,
          orderTotalMinor: subtotalMinor,
          depositMinor: subtotalMinor,
          cashBalanceDueMinor: 0n,
          status: "APPROVED",
          confirmedAt: new Date(),
          rechargeCodes: { create: securedCodes },
          events: {
            create: {
              eventType: "RECHARGE_AUTO_CONFIRMED",
              toStatus: "APPROVED",
              metadata: {
                codeCount: securedCodes.length,
                confirmation: "automatic_submission",
              },
            },
          },
        },
      });

      await transaction.checkoutIntent.update({
        where: { id: intent.id },
        data: { status: "SUBMITTED", submittedAt: new Date() },
      });

      return publicOrder(order, false);
    });

    // The order transaction is authoritative. Mail failure is recorded in the
    // outbox and can be retried without rolling back or duplicating the order.
    await Promise.all([
      dispatchOrderSubmittedNotification(result.reference),
      dispatchCustomerOrderSubmittedNotification(result.reference),
    ]);
    return result;
  }
}
