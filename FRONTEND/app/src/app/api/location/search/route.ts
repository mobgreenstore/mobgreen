import { ZodError } from "zod";
import {
  coordinateSearchSchema,
  postalSearchSchema,
} from "@/features/location/schema";
import { logger } from "@/server/core/logger";
import { reverseCoordinates, searchPostalCode } from "@/server/location/mapbox";
import {
  consumePublicRequest,
  publicThrottleKey,
} from "@/server/public-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function address(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: Request) {
  try {
    const allowed = await consumePublicRequest(
      "GEOCODING",
      publicThrottleKey(address(request)),
      { max: 40, windowMs: 60 * 60 * 1000 },
    );
    if (!allowed) {
      return Response.json(
        { error: "Too many location requests. Try again later." },
        { status: 429 },
      );
    }
    const body = (await request.json()) as Record<string, unknown>;
    if (body.mode === "POSTAL_CODE") {
      const input = postalSearchSchema.parse(body);
      return Response.json({
        suggestions: await searchPostalCode(input.query),
      });
    }
    if (body.mode === "CURRENT_LOCATION") {
      const input = coordinateSearchSchema.parse(body);
      const suggestion = await reverseCoordinates(
        input.latitude,
        input.longitude,
      );
      return Response.json({ suggestions: suggestion ? [suggestion] : [] });
    }
    return Response.json(
      { error: "Invalid location request." },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "Check the location details and try again." },
        { status: 400 },
      );
    }
    logger.error("location.provider_failed", { error });
    return Response.json(
      { error: "Location search is temporarily unavailable." },
      { status: 502 },
    );
  }
}
