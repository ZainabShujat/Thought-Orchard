import { currentUserId } from "@/server/auth/currentUser";
import { handle, privateJson, readJson } from "@/server/http";
import { createThoughtSchema } from "@/server/validation/schemas";
import { createThought, listThoughts } from "@/server/services/orchardService";

export const dynamic = "force-dynamic";

/** List the signed-in user's thoughts (spec 10). */
export function GET(request: Request): Promise<Response> {
  return handle(async () => privateJson(await listThoughts(await currentUserId(request))));
}

/** Plant a thought. Idempotent by `idempotencyKey` (spec 10). */
export function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const userId = await currentUserId(request);
    const input = await readJson(request, createThoughtSchema);
    const { thought, created } = await createThought(userId, input);
    return privateJson({ thought }, { status: created ? 201 : 200 });
  });
}
