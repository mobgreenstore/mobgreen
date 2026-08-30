import { describe, expect, it, vi } from "vitest";
import { logger } from "@/server/core/logger";

describe("structured server logger", () => {
  it("redacts secrets from nested metadata", () => {
    const output = vi
      .spyOn(console, "info")
      .mockImplementation(() => undefined);
    logger.info("Database diagnostic", {
      databaseUrl: "postgresql://sensitive",
      nested: { authorization: "Bearer sensitive", requestId: "req-1" },
    });
    const entry = String(output.mock.calls[0]?.[0]);
    expect(entry).not.toContain("postgresql://sensitive");
    expect(entry).not.toContain("Bearer sensitive");
    expect(entry).toContain("[REDACTED]");
    expect(entry).toContain("req-1");
  });
});
