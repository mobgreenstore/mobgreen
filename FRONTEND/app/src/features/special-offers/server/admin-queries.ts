import "server-only";

import { SpecialOfferStatus } from "@/generated/prisma/client";
import { requireAdminPermission } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

const ADMIN_OFFER_PAGE_SIZE = 12;
const offerStatuses = ["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED"] as const;

export type AdminOfferStatus = (typeof offerStatuses)[number];

export interface AdminOfferFilters {
  query: string;
  status: AdminOfferStatus | "ALL";
  page: number;
}

export function parseAdminOfferFilters(
  input: Record<string, string | string[] | undefined>,
): AdminOfferFilters {
  const rawQuery = Array.isArray(input.q) ? input.q[0] : input.q;
  const rawStatus = Array.isArray(input.status)
    ? input.status[0]
    : input.status;
  const rawPage = Array.isArray(input.page) ? input.page[0] : input.page;
  return {
    query: (rawQuery ?? "").trim().slice(0, 100),
    status: offerStatuses.includes(rawStatus as AdminOfferStatus)
      ? (rawStatus as AdminOfferStatus)
      : "ALL",
    page: Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1),
  };
}

export async function listAdminOfferCampaigns(filters: AdminOfferFilters) {
  await requireAdminPermission("catalog.read");
  const now = new Date();
  await prisma.specialOffer.updateMany({
    where: { status: SpecialOfferStatus.ACTIVE, endsAt: { lte: now } },
    data: { status: SpecialOfferStatus.EXPIRED },
  });
  const where = {
    archivedAt: null,
    ...(filters.status === "ALL" ? {} : { status: filters.status }),
    ...(filters.query
      ? {
          OR: [
            {
              category: {
                name: {
                  contains: filters.query,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              product: {
                name: {
                  contains: filters.query,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  };
  const [campaignKeys, allCampaigns, enabledPolicyCount] = await Promise.all([
    prisma.specialOffer.findMany({
      where,
      distinct: ["generationKey"],
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * ADMIN_OFFER_PAGE_SIZE,
      take: ADMIN_OFFER_PAGE_SIZE,
      select: { generationKey: true },
    }),
    prisma.specialOffer.findMany({
      where,
      distinct: ["generationKey"],
      select: { generationKey: true, status: true, endsAt: true },
    }),
    prisma.categoryOfferPolicy.count({ where: { enabled: true } }),
  ]);
  const keys = campaignKeys.map((campaign) => campaign.generationKey);
  const rows = keys.length
    ? await prisma.specialOffer.findMany({
        where: { generationKey: { in: keys }, archivedAt: null },
        orderBy: [{ createdAt: "desc" }, { discountBps: "desc" }],
        select: {
          generationKey: true,
          status: true,
          startsAt: true,
          endsAt: true,
          discountBps: true,
          currency: true,
          category: { select: { id: true, name: true } },
          product: { select: { name: true } },
        },
      })
    : [];
  const grouped = new Map<
    string,
    {
      generationKey: string;
      category: { id: string; name: string };
      status: AdminOfferStatus;
      startsAt: string;
      endsAt: string;
      offerCount: number;
      maximumDiscountBps: number;
      currencies: Set<"GBP" | "EUR" | "USD">;
      products: Set<string>;
    }
  >();
  for (const row of rows) {
    const campaign = grouped.get(row.generationKey) ?? {
      generationKey: row.generationKey,
      category: row.category,
      status: row.status,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      offerCount: 0,
      maximumDiscountBps: 0,
      currencies: new Set<"GBP" | "EUR" | "USD">(),
      products: new Set<string>(),
    };
    campaign.offerCount += 1;
    campaign.maximumDiscountBps = Math.max(
      campaign.maximumDiscountBps,
      row.discountBps,
    );
    campaign.currencies.add(row.currency);
    campaign.products.add(row.product.name);
    grouped.set(row.generationKey, campaign);
  }
  const total = allCampaigns.length;
  return {
    campaigns: keys.flatMap((key) => {
      const campaign = grouped.get(key);
      return campaign
        ? [
            {
              ...campaign,
              currencies: [...campaign.currencies],
              products: [...campaign.products],
            },
          ]
        : [];
    }),
    metrics: {
      total,
      active: allCampaigns.filter((campaign) => campaign.status === "ACTIVE")
        .length,
      drafts: allCampaigns.filter((campaign) => campaign.status === "DRAFT")
        .length,
      endingSoon: allCampaigns.filter(
        (campaign) =>
          campaign.status === "ACTIVE" &&
          campaign.endsAt > now &&
          campaign.endsAt <= new Date(now.getTime() + 60 * 60 * 1000),
      ).length,
      enabledCategories: enabledPolicyCount,
    },
    pagination: {
      page: filters.page,
      pageSize: ADMIN_OFFER_PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / ADMIN_OFFER_PAGE_SIZE)),
    },
  };
}
