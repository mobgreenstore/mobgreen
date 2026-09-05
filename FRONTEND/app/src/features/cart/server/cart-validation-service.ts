import "server-only";

import { cartLineKey } from "@/features/cart/domain";
import type {
  CartLineIssue,
  CartValidationResult,
  StoredCartLine,
  ValidatedCartLine,
} from "@/features/cart/types";
import type {
  CartPriceRecord,
  CartRepository,
} from "@/features/cart/server/cart-repository";

function unavailableLine(
  line: StoredCartLine,
  issues: CartLineIssue[],
  record?: CartPriceRecord,
): ValidatedCartLine {
  return {
    ...line,
    key: cartLineKey(line),
    productName: record?.product.name ?? "Unavailable item",
    productSlug: record?.product.slug ?? null,
    image: record?.product.image ?? null,
    option: record
      ? {
          id: record.id,
          weightValue: record.weightValue,
          weightUnit: record.weightUnit,
          currency: record.currency,
          priceMinor: Number(record.priceMinor),
          available: false,
        }
      : null,
    offer: null,
    available: false,
    issues,
  };
}

export class CartValidationService {
  constructor(private readonly repository: CartRepository) {}

  async validate(
    lines: readonly StoredCartLine[],
  ): Promise<CartValidationResult> {
    const records = await this.repository.findPriceOptions(
      lines.map((line) => line.priceOptionId),
    );
    const byOptionId = new Map(records.map((record) => [record.id, record]));
    const offerRecords = this.repository.findOffers
      ? await this.repository.findOffers(
          lines.flatMap((line) =>
            line.specialOfferId ? [line.specialOfferId] : [],
          ),
        )
      : [];
    const byOfferId = new Map(
      offerRecords.map((offer) => [offer.publicId, offer]),
    );
    const now = new Date();

    const validatedLines = lines.map((line): ValidatedCartLine => {
      const record = byOptionId.get(line.priceOptionId);
      if (!record) {
        return unavailableLine(line, [
          {
            code: "OPTION_UNAVAILABLE",
            message: "This price option no longer exists.",
          },
        ]);
      }
      if (record.productId !== line.productId) {
        return unavailableLine(line, [
          {
            code: "PRODUCT_MISMATCH",
            message: "This card selection is invalid and must be removed.",
          },
        ]);
      }

      if (line.specialOfferId) {
        const offer = byOfferId.get(line.specialOfferId);
        if (!offer) {
          return unavailableLine(
            line,
            [
              {
                code: "OFFER_UNAVAILABLE",
                message: "This special offer no longer exists.",
              },
            ],
            record,
          );
        }
        const offerIssues: CartLineIssue[] = [];
        if (
          offer.productId !== line.productId ||
          offer.priceOptionId !== line.priceOptionId
        ) {
          offerIssues.push({
            code: "PRODUCT_MISMATCH",
            message: "This offer selection is invalid and must be removed.",
          });
        }
        if (
          offer.status !== "ACTIVE" ||
          offer.archivedAt !== null ||
          offer.startsAt > now
        ) {
          offerIssues.push({
            code: "OFFER_UNAVAILABLE",
            message: "This special offer is not active.",
          });
        }
        if (offer.endsAt <= now) {
          offerIssues.push({
            code: "OFFER_EXPIRED",
            message: "This special offer has expired.",
          });
        }
        const expectedOriginal =
          record.priceMinor * BigInt(offer.bundleQuantity);
        if (
          offer.currency !== record.currency ||
          offer.originalTotalMinor !== expectedOriginal ||
          offer.offerTotalMinor !==
            offer.originalTotalMinor - offer.discountMinor ||
          offer.discountBps <= 0 ||
          offer.discountBps > 1500
        ) {
          offerIssues.push({
            code: "OFFER_CHANGED",
            message: "The product price or offer terms changed.",
          });
        }
        const policy = record.product.offerPolicy;
        const cost = record.costMinor ?? null;
        if (!policy?.enabled || cost === null || cost <= 0n) {
          offerIssues.push({
            code: "OFFER_MARGIN_UNSAFE",
            message: "This offer can no longer be confirmed safely.",
          });
        } else {
          const numerator =
            cost *
            BigInt(offer.bundleQuantity) *
            BigInt(10_000 + policy.minimumMarginBps);
          const safeFloor = (numerator + 9_999n) / 10_000n;
          if (offer.offerTotalMinor < safeFloor) {
            offerIssues.push({
              code: "OFFER_MARGIN_UNSAFE",
              message: "This offer no longer preserves the store margin.",
            });
          }
        }
        const productUnavailable =
          record.product.status !== "ACTIVE" ||
          record.product.archivedAt !== null ||
          !record.product.categoryActive ||
          record.product.categoryArchivedAt !== null ||
          !record.isActive ||
          record.archivedAt !== null;
        if (productUnavailable) {
          offerIssues.push({
            code: "PRODUCT_UNAVAILABLE",
            message: "This offer product is no longer available.",
          });
        }
        const offerPrice = Number(offer.offerTotalMinor);
        if (
          !Number.isSafeInteger(offerPrice) ||
          !Number.isSafeInteger(offerPrice * line.quantity)
        ) {
          offerIssues.push({
            code: "PRICE_UNAVAILABLE",
            message: "The offer price could not be confirmed.",
          });
        }
        if (offerIssues.length) {
          return unavailableLine(line, offerIssues, record);
        }
        return {
          ...line,
          key: cartLineKey(line),
          productName: record.product.name,
          productSlug: record.product.slug,
          image: record.product.image,
          option: {
            id: record.id,
            weightValue: offer.totalWeightGrams,
            weightUnit: "G",
            currency: offer.currency,
            priceMinor: offerPrice,
            available: true,
          },
          offer: {
            publicId: offer.publicId,
            discountBps: offer.discountBps,
            originalTotalMinor: Number(offer.originalTotalMinor),
            discountMinor: Number(offer.discountMinor),
            bundleQuantity: offer.bundleQuantity,
            endsAt: offer.endsAt.toISOString(),
          },
          available: true,
          issues: [],
        };
      }

      const issues: CartLineIssue[] = [];
      const productUnavailable =
        record.product.status !== "ACTIVE" ||
        record.product.archivedAt !== null ||
        !record.product.categoryActive ||
        record.product.categoryArchivedAt !== null;
      if (productUnavailable) {
        issues.push({
          code: "PRODUCT_UNAVAILABLE",
          message: "This product is no longer available.",
        });
      }
      if (!record.isActive || record.archivedAt !== null) {
        issues.push({
          code: "OPTION_UNAVAILABLE",
          message: "This weight and price option is no longer available.",
        });
      }

      const priceMinor = Number(record.priceMinor);
      const priceSafe =
        Number.isSafeInteger(priceMinor) &&
        priceMinor >= 0 &&
        Number.isSafeInteger(priceMinor * line.quantity);
      if (!priceSafe) {
        issues.push({
          code: "PRICE_UNAVAILABLE",
          message: "The current price could not be confirmed.",
        });
      }
      if (issues.length > 0) return unavailableLine(line, issues, record);

      return {
        ...line,
        key: cartLineKey(line),
        productName: record.product.name,
        productSlug: record.product.slug,
        image: record.product.image,
        option: {
          id: record.id,
          weightValue: record.weightValue,
          weightUnit: record.weightUnit,
          currency: record.currency,
          priceMinor,
          available: true,
        },
        offer: null,
        available: true,
        issues: [],
      };
    });

    const availableLines = validatedLines.filter(
      (
        line,
      ): line is ValidatedCartLine & {
        option: NonNullable<ValidatedCartLine["option"]>;
      } => line.available && line.option !== null,
    );
    const currencies = [
      ...new Set(availableLines.map((line) => line.option.currency)),
    ];
    const hasCurrencyConflict = currencies.length > 1;
    const subtotalMinor = hasCurrencyConflict
      ? null
      : availableLines.reduce(
          (total, line) => total + line.option.priceMinor * line.quantity,
          0,
        );
    const allAvailable =
      validatedLines.length > 0 &&
      validatedLines.every((line) => line.available);

    return {
      lines: validatedLines,
      itemCount: lines.reduce((total, line) => total + line.quantity, 0),
      currency: currencies.length === 1 ? (currencies[0] ?? null) : null,
      currencies,
      subtotalMinor,
      hasCurrencyConflict,
      checkoutEligible: allAvailable && !hasCurrencyConflict,
    };
  }
}
