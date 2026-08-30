import { ZodError } from "zod";
import { confirmLocationSchema } from "@/features/location/schema";
import { verifyLocationCandidate } from "@/server/location/verification";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { verificationToken } = confirmLocationSchema.parse(
      await request.json(),
    );
    const candidate = verifyLocationCandidate(verificationToken);
    if (!candidate) {
      return Response.json(
        { error: "Select a valid location result again." },
        { status: 400 },
      );
    }
    return Response.json({
      location: {
        ...candidate,
        confirmedAt: new Date().toISOString(),
        verificationToken,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "Select a valid location result again." },
        { status: 400 },
      );
    }
    return Response.json(
      { error: "Location could not be confirmed." },
      { status: 500 },
    );
  }
}
