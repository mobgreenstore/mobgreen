import { beforeEach, describe, expect, it, vi } from "vitest";

const permission = vi.hoisted(() => vi.fn(async () => ({ id: "admin-id" })));
const preview = vi.hoisted(() => vi.fn());
const activate = vi.hoisted(() => vi.fn());
const cancel = vi.hoisted(() => vi.fn());

vi.mock("@/server/auth/authorization", () => ({
  requireAdminPermission: permission,
}));
vi.mock("@/features/special-offers/server/campaign-service", () => ({
  SpecialOfferCampaignService: class {
    preview = preview;
    activate = activate;
    cancel = cancel;
  },
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const { previewCampaignAction, activateCampaignAction, cancelCampaignAction } =
  await import("@/features/special-offers/server/actions");

const categoryId = "124bf462-6765-451c-8db8-d47976ec9595";
const generationKey = "419cd6b4-2c1b-40d0-80f8-52a46c652998";

describe("special-offer admin actions", () => {
  beforeEach(() => {
    preview.mockResolvedValue({ offers: [], exclusions: [] });
    activate.mockResolvedValue(2);
    cancel.mockResolvedValue(2);
  });

  it("authorizes previews before reading profitability data", async () => {
    await previewCampaignAction(categoryId);
    expect(permission).toHaveBeenCalledWith("catalog.write");
    expect(permission.mock.invocationCallOrder[0]).toBeLessThan(
      preview.mock.invocationCallOrder[0] ?? Infinity,
    );
  });

  it("does not invoke campaign operations when authorization fails", async () => {
    permission.mockRejectedValueOnce(new Error("Unauthorized"));
    await expect(
      activateCampaignAction(categoryId, generationKey),
    ).rejects.toThrow("Unauthorized");
    expect(activate).not.toHaveBeenCalled();
  });

  it("returns generic operation feedback without exposing internals", async () => {
    cancel.mockRejectedValueOnce(new Error("Campaign cannot be cancelled."));
    await expect(
      cancelCampaignAction(categoryId, generationKey),
    ).resolves.toEqual({
      status: "error",
      message: "Campaign cannot be cancelled.",
    });
  });
});
