import { currentUserId } from "@/server/auth/currentUser";
import { errorResponse, handle, privateJson } from "@/server/http";
import { seedSampleOrchard } from "@/server/services/devSeed";

export const dynamic = "force-dynamic";

/** Development only: plant the sample orchard into the signed-in user's own orchard. */
export function POST(request: Request): Promise<Response> {
  if (process.env.NODE_ENV === "production") return Promise.resolve(errorResponse(404, "not_found", "Not found."));
  return handle(async () => privateJson(await seedSampleOrchard(await currentUserId(request))));
}
