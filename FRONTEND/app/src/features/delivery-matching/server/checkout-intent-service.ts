import "server-only";

import { randomBytes } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { CartValidationService } from "@/features/cart/server/cart-validation-service";
import { PrismaCartRepository } from "@/features/cart/server/prisma-cart-repository";
import { storedCartLinesSchema } from "@/features/cart/schema";
import { isBitcoinCheckoutConfigured } from "@/features/bitcoin/server/environment";
import type {
  SelectCourierInput,
  StartCheckoutIntentInput,
  UpdateIntentLocationInput,
} from "@/features/delivery-matching/schema";
import { generateSimulatedCourierCandidates } from "@/features/delivery-matching/server/matching";
import {
  parseStoredCourierCandidates,
  toPublicCourierCandidate,
} from "@/features/delivery-matching/server/candidate-set";
import type {
  CheckoutConfirmationView,
  CheckoutIntentView,
} from "@/features/delivery-matching/types";
import type { GuestSessionIdentity } from "@/server/guest-session";
import { prisma } from "@/server/db/client";
import { withTransaction } from "@/server/db/transaction";
import { verifyLocationCandidate } from "@/server/location/verification";

const INTENT_TTL_MS = 30 * 60 * 1000;
export type CheckoutIntentErrorCode =
  | "CART_CHANGED"
  | "INTENT_EXPIRED"
  | "INTENT_NOT_FOUND"
  | "INVALID_LOCATION"
  | "INVALID_SELECTION"
  | "MIXED_CURRENCY"
  | "PAYMENT_UNAVAILABLE";

export class CheckoutIntentError extends Error {
  constructor(
    readonly code: CheckoutIntentErrorCode,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CheckoutIntentError";
  }
}

function publicId() {
  return randomBytes(24).toString("base64url");
}

type IntentRecord = {
  publicId: string;
  status: "DRAFT" | "MATCHING" | "DRIVER_SELECTED" | "SUBMITTED" | "EXPIRED";
  fulfillmentType: "PICKUP" | "DELIVERY";
  paymentMethod: "RECHARGE_FROM_STORE" | "RECHARGE_ONLINE" | "BITCOIN_DEPOSIT";
  rechargeProvider: string | null;
  currency: "GBP" | "EUR" | "USD";
  subtotalMinor: bigint;
  deliveryAddress: string | null;
  deliveryPostalCode: string | null;
  deliveryLocality: string | null;
  deliveryCountryCode: string | null;
  candidateSet: Prisma.JsonValue | null;
  selectedCourierProfileId: string | null;
  selectedCourierName: string | null;
  selectedDistanceMeters: number | null;
  selectedDurationSeconds: number | null;
  expiresAt: Date;
};

export function checkoutIntentView(intent: IntentRecord): CheckoutIntentView {
  const storedCandidates = parseStoredCourierCandidates(intent.candidateSet);
  const candidates = storedCandidates.map(toPublicCourierCandidate);
  const selectedCandidate = intent.selectedCourierProfileId
    ? storedCandidates.find(
        (candidate) => candidate.profileId === intent.selectedCourierProfileId,
      )
    : null;
  const selectedCourier =
    selectedCandidate &&
    intent.selectedCourierName &&
    intent.selectedDistanceMeters !== null &&
    intent.selectedDurationSeconds !== null
      ? {
          candidateId: selectedCandidate.candidateId,
          displayName: intent.selectedCourierName,
          distanceMeters: intent.selectedDistanceMeters,
          estimatedDurationSeconds: intent.selectedDurationSeconds,
        }
      : null;
  return {
    publicId: intent.publicId,
    status:
      intent.expiresAt <= new Date() && intent.status !== "SUBMITTED"
        ? "EXPIRED"
        : intent.status,
    fulfillmentType: intent.fulfillmentType,
    paymentMethod: intent.paymentMethod,
    rechargeProvider: intent.rechargeProvider,
    currency: intent.currency,
    subtotalMinor: Number(intent.subtotalMinor),
    location: intent.deliveryAddress
      ? {
          formattedAddress: intent.deliveryAddress,
          postalCode: intent.deliveryPostalCode,
          locality: intent.deliveryLocality,
          countryCode: intent.deliveryCountryCode,
        }
      : null,
    candidates,
    selectedCourier,
    expiresAt: intent.expiresAt.toISOString(),
  };
}

function verifySubmittedLocation(
  location:
    | StartCheckoutIntentInput["deliveryLocation"]
    | UpdateIntentLocationInput["deliveryLocation"],
) {
  if (!location) return null;
  const verified = verifyLocationCandidate(location.verificationToken);
  if (
    !verified ||
    verified.mapboxPlaceId !== location.mapboxPlaceId ||
    verified.latitude !== location.latitude ||
    verified.longitude !== location.longitude ||
    verified.formattedAddress !== location.formattedAddress
  ) {
    throw new CheckoutIntentError(
      "INVALID_LOCATION",
      "Confirm the delivery location again.",
      400,
    );
  }
  return verified;
}

const intentSelect = {
  publicId: true,
  status: true,
  fulfillmentType: true,
  paymentMethod: true,
  rechargeProvider: true,
  currency: true,
  subtotalMinor: true,
  deliveryAddress: true,
  deliveryPostalCode: true,
  deliveryLocality: true,
  deliveryCountryCode: true,
  candidateSet: true,
  selectedCourierProfileId: true,
  selectedCourierName: true,
  selectedDistanceMeters: true,
  selectedDurationSeconds: true,
  expiresAt: true,
} satisfies Prisma.CheckoutIntentSelect;

export class CheckoutIntentService {
  async create(
    input: StartCheckoutIntentInput,
    guest: GuestSessionIdentity,
  ): Promise<CheckoutIntentView> {
    if (
      input.paymentMethod === "BITCOIN_DEPOSIT" &&
      !isBitcoinCheckoutConfigured()
    ) {
      throw new CheckoutIntentError(
        "PAYMENT_UNAVAILABLE",
        "Bitcoin checkout is not available yet.",
        503,
      );
    }
    const cart = await new CartValidationService(
      new PrismaCartRepository(),
    ).validate(input.lines);
    if (
      !cart.checkoutEligible ||
      cart.subtotalMinor === null ||
      !cart.currency
    ) {
      throw new CheckoutIntentError(
        cart.hasCurrencyConflict ? "MIXED_CURRENCY" : "CART_CHANGED",
        cart.hasCurrencyConflict
          ? "An order must use one currency."
          : "A product or price changed. Review the cart and retry.",
        409,
      );
    }

    const validatedCurrency = cart.currency;
    const validatedSubtotalMinor = cart.subtotalMinor;

    const location =
      input.fulfillmentType === "DELIVERY"
        ? verifySubmittedLocation(input.deliveryLocation)
        : null;
    const id = publicId();
    const candidates = location
      ? generateSimulatedCourierCandidates(
          [guest.tokenHash, id, location.mapboxPlaceId].join(":"),
        )
      : [];
    const status = location ? "MATCHING" : "DRAFT";
    const expiresAt = new Date(Date.now() + INTENT_TTL_MS);

    return withTransaction(async (transaction) => {
      const guestSession = await transaction.guestSession.upsert({
        where: { tokenHash: guest.tokenHash },
        create: { tokenHash: guest.tokenHash, expiresAt: guest.expiresAt },
        update: { expiresAt: guest.expiresAt, lastSeenAt: new Date() },
        select: { id: true },
      });
      const existing = await transaction.checkoutIntent.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        select: { ...intentSelect, guestSessionId: true },
      });
      if (existing) {
        if (existing.guestSessionId !== guestSession.id) {
          throw new CheckoutIntentError(
            "INTENT_NOT_FOUND",
            "The checkout could not be continued.",
            404,
          );
        }
        return checkoutIntentView(existing);
      }
      const created = await transaction.checkoutIntent.create({
        data: {
          publicId: id,
          guestSessionId: guestSession.id,
          idempotencyKey: input.idempotencyKey,
          status,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          fulfillmentType: input.fulfillmentType,
          paymentMethod: input.paymentMethod,
          rechargeProvider:
            input.paymentMethod === "RECHARGE_ONLINE"
              ? (input.rechargeProvider ?? null)
              : null,
          cartLines: input.lines,
          currency: validatedCurrency,
          subtotalMinor: BigInt(validatedSubtotalMinor),
          deliveryAddress: location?.formattedAddress ?? null,
          deliveryPostalCode: location?.postalCode || null,
          deliveryLocality: location?.locality || null,
          deliveryCountryCode: location?.countryCode ?? null,
          destinationLatitude: location?.latitude ?? null,
          destinationLongitude: location?.longitude ?? null,
          destinationMapboxPlaceId: location?.mapboxPlaceId ?? null,
          candidateSet: candidates as unknown as Prisma.InputJsonValue,
          expiresAt,
        },
        select: intentSelect,
      });
      return checkoutIntentView(created);
    });
  }

  async getForGuest(
    guestSessionId: string,
    intentId: string,
  ): Promise<CheckoutIntentView | null> {
    const intent = await prisma.checkoutIntent.findFirst({
      where: { publicId: intentId, guestSessionId },
      select: {
        ...intentSelect,
        order: { select: { reference: true, paymentStatus: true } },
      },
    });
    if (!intent) return null;
    if (intent.expiresAt <= new Date() && intent.status !== "SUBMITTED") {
      await prisma.checkoutIntent.updateMany({
        where: {
          publicId: intentId,
          guestSessionId,
          status: { not: "SUBMITTED" },
        },
        data: { status: "EXPIRED" },
      });
      return checkoutIntentView({ ...intent, status: "EXPIRED" });
    }
    return {
      ...checkoutIntentView(intent),
      paymentApproved: intent.order?.paymentStatus === "PAID",
      orderReference: intent.order?.reference ?? null,
    };
  }

  async getConfirmationForGuest(
    guestSessionId: string,
    intentId: string,
  ): Promise<CheckoutConfirmationView | null> {
    const intent = await prisma.checkoutIntent.findFirst({
      where: { publicId: intentId, guestSessionId },
      select: {
        ...intentSelect,
        customerName: true,
        customerEmail: true,
        cartLines: true,
      },
    });
    if (!intent) return null;
    const view = checkoutIntentView(intent);
    const storedLines = parseIntentCartLines(intent.cartLines);
    const cart = await new CartValidationService(
      new PrismaCartRepository(),
    ).validate(storedLines);
    const confirmationEligible =
      view.status !== "EXPIRED" &&
      cart.checkoutEligible &&
      cart.currency === intent.currency &&
      cart.subtotalMinor === Number(intent.subtotalMinor);

    return {
      ...view,
      customer: {
        name: intent.customerName,
        email: intent.customerEmail,
      },
      lines: cart.lines.flatMap((line) => {
        if (!line.option) return [];
        return [
          {
            key: line.key,
            productName: line.productName,
            image: line.image,
            weightValue: line.option.weightValue,
            weightUnit: line.option.weightUnit,
            quantity: line.quantity,
            unitPriceMinor: line.option.priceMinor,
            lineTotalMinor: line.option.priceMinor * line.quantity,
            discountBps: line.offer?.discountBps ?? null,
          },
        ];
      }),
      itemCount: cart.itemCount,
      confirmationEligible,
    };
  }

  async updateLocation(
    guestSessionId: string,
    input: UpdateIntentLocationInput,
  ): Promise<CheckoutIntentView> {
    const location = verifySubmittedLocation(input.deliveryLocation);
    if (!location) {
      throw new CheckoutIntentError(
        "INVALID_LOCATION",
        "Confirm the delivery location again.",
        400,
      );
    }
    const existing = await prisma.checkoutIntent.findFirst({
      where: {
        publicId: input.intentId,
        guestSessionId,
        fulfillmentType: "DELIVERY",
      },
      select: { id: true, publicId: true, status: true, expiresAt: true },
    });
    if (!existing) {
      throw new CheckoutIntentError(
        "INTENT_NOT_FOUND",
        "The checkout could not be continued.",
        404,
      );
    }
    if (existing.expiresAt <= new Date() || existing.status === "SUBMITTED") {
      throw new CheckoutIntentError(
        "INTENT_EXPIRED",
        "This checkout has expired. Return to checkout and try again.",
        410,
      );
    }
    const candidates = generateSimulatedCourierCandidates(
      [guestSessionId, existing.publicId, location.mapboxPlaceId].join(":"),
    );
    const updated = await prisma.checkoutIntent.update({
      where: { id: existing.id },
      data: {
        status: "MATCHING",
        deliveryAddress: location.formattedAddress,
        deliveryPostalCode: location.postalCode || null,
        deliveryLocality: location.locality || null,
        deliveryCountryCode: location.countryCode,
        destinationLatitude: location.latitude,
        destinationLongitude: location.longitude,
        destinationMapboxPlaceId: location.mapboxPlaceId,
        candidateSet: candidates as unknown as Prisma.InputJsonValue,
        selectedCourierProfileId: null,
        selectedCourierName: null,
        selectedDistanceMeters: null,
        selectedDurationSeconds: null,
      },
      select: intentSelect,
    });
    return checkoutIntentView(updated);
  }

  async selectCourier(
    guestSessionId: string,
    input: SelectCourierInput,
  ): Promise<CheckoutIntentView> {
    const intent = await prisma.checkoutIntent.findFirst({
      where: {
        publicId: input.intentId,
        guestSessionId,
        fulfillmentType: "DELIVERY",
      },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        candidateSet: true,
        order: { select: { paymentStatus: true } },
      },
    });
    if (!intent) {
      throw new CheckoutIntentError(
        "INTENT_NOT_FOUND",
        "The checkout could not be continued.",
        404,
      );
    }
    const postPaymentSelection =
      intent.status === "SUBMITTED" && intent.order?.paymentStatus === "PAID";
    if (
      (intent.expiresAt <= new Date() && !postPaymentSelection) ||
      (intent.status === "SUBMITTED" && !postPaymentSelection)
    ) {
      throw new CheckoutIntentError(
        "INTENT_EXPIRED",
        "This checkout has expired. Return to checkout and try again.",
        410,
      );
    }
    const candidate = parseStoredCourierCandidates(intent.candidateSet).find(
      (item) => item.candidateId === input.courierCandidateId,
    );
    if (!candidate) {
      throw new CheckoutIntentError(
        "INVALID_SELECTION",
        "Choose one of the available delivery profiles.",
        400,
      );
    }
    const updated = await prisma.checkoutIntent.update({
      where: { id: intent.id },
      data: {
        status: postPaymentSelection ? "SUBMITTED" : "DRIVER_SELECTED",
        selectedCourierProfileId: candidate.profileId,
        selectedCourierName: candidate.displayName,
        selectedDistanceMeters: candidate.distanceMeters,
        selectedDurationSeconds: candidate.estimatedDurationSeconds,
        ...(postPaymentSelection
          ? {
              order: {
                update: {
                  courierProfileIdSnapshot: candidate.profileId,
                  courierNameSnapshot: candidate.displayName,
                  courierDistanceMeters: candidate.distanceMeters,
                  courierDurationSeconds: candidate.estimatedDurationSeconds,
                },
              },
            }
          : {}),
      },
      select: intentSelect,
    });
    return checkoutIntentView(updated);
  }
}

export function parseIntentCartLines(value: Prisma.JsonValue) {
  return storedCartLinesSchema.parse(value);
}
