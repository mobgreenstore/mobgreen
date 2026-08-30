import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { executeWrite } from "@/server/core/write-boundary";

describe("executeWrite", () => {
  it("does not call persistence when validation fails", async () => {
    const persistence = vi.fn();
    const result = await executeWrite(
      "category.create",
      z.object({ name: z.string().min(2) }),
      { name: "" },
      persistence,
    );
    expect(result.ok).toBe(false);
    expect(persistence).not.toHaveBeenCalled();
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns the typed value after a successful write", async () => {
    const result = await executeWrite(
      "category.create",
      z.object({ name: z.string().trim() }),
      { name: " Greens " },
      async ({ name }) => ({ id: "category-id", name }),
    );
    expect(result).toEqual({
      ok: true,
      value: { id: "category-id", name: "Greens" },
    });
  });
});
