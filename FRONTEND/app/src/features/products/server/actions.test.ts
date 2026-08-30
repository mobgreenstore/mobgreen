import { describe, expect, it, vi } from "vitest";

const permission = vi.hoisted(() => vi.fn(async () => ({ id: "admin-id" })));
const archive = vi.hoisted(() => vi.fn());
const createMany = vi.hoisted(() => vi.fn());
const redirect = vi.hoisted(() => vi.fn());

vi.mock("@/server/auth/authorization", () => ({
  requireAdminPermission: permission,
}));
vi.mock("@/server/services/product-write-service", () => ({
  ProductWriteService: class {
    archive = archive;
    createMany = createMany;
  },
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
vi.mock("next/navigation", () => ({ redirect }));

const { archiveProductAction, createProductsAction } =
  await import("@/features/products/server/actions");
const { majorToMinor } = await import("@/features/products/server/pricing");

describe("product actions", () => {
  it("converts decimal input to exact integer minor units", () => {
    expect(majorToMinor("12.34")).toBe("1234");
    expect(majorToMinor("12.3")).toBe("1230");
    expect(majorToMinor("0.01")).toBe("1");
    expect(majorToMinor("12.345")).toBe("-1");
  });

  it("authorizes and converts every product in a bulk write", async () => {
    createMany.mockResolvedValue({
      ok: true,
      value: [{ id: "first" }, { id: "second" }],
    });
    const formData = new FormData();
    formData.set(
      "products",
      JSON.stringify([
        {
          categoryId: "124bf462-6765-451c-8db8-d47976ec9595",
          name: "Spinach",
          shortDescription: "Fresh spinach",
          status: "DRAFT",
          images: [],
          priceOptions: [
            {
              weightValue: "500",
              weightUnit: "G",
              currency: "EUR",
              priceMajor: "12.34",
            },
          ],
        },
        {
          categoryId: "124bf462-6765-451c-8db8-d47976ec9595",
          name: "Kale",
          shortDescription: "Fresh kale",
          status: "DRAFT",
          images: [],
          priceOptions: [],
        },
      ]),
    );

    await createProductsAction({ status: "idle" }, formData);

    expect(permission).toHaveBeenCalledWith("catalog.write");
    expect(createMany).toHaveBeenCalledWith({
      products: [
        expect.objectContaining({
          name: "Spinach",
          priceOptions: [
            expect.objectContaining({
              currency: "EUR",
              priceMinor: "1234",
            }),
          ],
        }),
        expect.objectContaining({ name: "Kale", priceOptions: [] }),
      ],
    });
    expect(redirect).toHaveBeenCalledWith("/admin/products?created=2");
  });

  it("authorizes product writes before calling the service", async () => {
    archive.mockResolvedValue({ ok: true, value: { id: "product-id" } });
    await archiveProductAction("124bf462-6765-451c-8db8-d47976ec9595");
    expect(permission).toHaveBeenCalledWith("catalog.write");
    expect(permission.mock.invocationCallOrder[0]).toBeLessThan(
      archive.mock.invocationCallOrder[0] ?? Infinity,
    );
  });
});
