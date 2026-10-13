import { z } from "zod";
import { currentUserId } from "@/server/auth/currentUser";
import { errorResponse, handle, readJson } from "@/server/http";
import { getDevClockOffsetDays, now, setDevClockOffsetDays } from "@/server/clock";

export const dynamic = "force-dynamic";

const notInProduction = () => errorResponse(404, "not_found", "Not found.");

/** Development only: read the server clock offset (spec 20.9, step 7). */
export function GET(request: Request): Promise<Response> {
  if (process.env.NODE_ENV === "production") return Promise.resolve(notInProduction());
  return handle(async () => {
    await currentUserId(request);
    return Response.json({ offsetDays: getDevClockOffsetDays(), serverNow: now().toISOString() });
  });
}

/** Development only: move the server clock forward by `offsetDays` to review growth. */
export function POST(request: Request): Promise<Response> {
  if (process.env.NODE_ENV === "production") return Promise.resolve(notInProduction());
  return handle(async () => {
    await currentUserId(request);
    const { offsetDays } = await readJson(request, z.object({ offsetDays: z.number().min(0).max(365) }));
    setDevClockOffsetDays(offsetDays);
    return Response.json({ offsetDays, serverNow: now().toISOString() });
  });
}
