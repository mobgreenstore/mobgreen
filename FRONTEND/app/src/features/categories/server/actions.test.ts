import { describe, expect, it, vi } from "vitest";

const permission = vi.hoisted(() => vi.fn(async () => ({ id: "admin-id" })));
const archive = vi.hoisted(() => vi.fn());

vi.mock("@/server/auth/authorization", () => ({
  requireAdminPermission: permission,
}));
vi.mock("@/server/services/category-write-service", () => ({
  CategoryWriteService: class {
    archive = archive;
  },
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const { archiveCategoryAction } =
  await import("@/features/categories/server/actions");

describe("category admin actions", () => {
  it("authorizes category writes before invoking the service", async () => {
    archive.mockResolvedValue({ ok: true, value: { id: "category-id" } });
    await archiveCategoryAction("124bf462-6765-451c-8db8-d47976ec9595");
    expect(permission).toHaveBeenCalledWith("catalog.write");
    expect(permission.mock.invocationCallOrder[0]).toBeLessThan(
      archive.mock.invocationCallOrder[0] ?? Infinity,
    );
  });

  it("returns safe archive conflicts to the interface", async () => {
    archive.mockResolvedValue({
      ok: false,
      error: { code: "CONFLICT", message: "Move products before archiving." },
    });
    await expect(
      archiveCategoryAction("124bf462-6765-451c-8db8-d47976ec9595"),
    ).resolves.toEqual({
      status: "error",
      message: "Move products before archiving.",
    });
  });
});
