import type { z } from "zod";
import { mapPersistenceError } from "@/server/core/errors";
import { logger } from "@/server/core/logger";
import { failure, success, type Result } from "@/server/core/result";

export async function executeWrite<TSchema extends z.ZodType, TOutput>(
  operationName: string,
  schema: TSchema,
  input: unknown,
  operation: (validated: z.output<TSchema>) => Promise<TOutput>,
): Promise<Result<TOutput>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(parsed.error.flatten().fieldErrors).filter(
        (entry): entry is [string, string[]] => Array.isArray(entry[1]),
      ),
    );
    return failure({
      code: "VALIDATION_ERROR",
      message: "Review the submitted information.",
      fieldErrors,
    });
  }

  try {
    return success(await operation(parsed.data));
  } catch (error) {
    logger.error("Server write failed", { operationName, error });
    return failure(mapPersistenceError(error));
  }
}
