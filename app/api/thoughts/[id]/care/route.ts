import { currentUserId } from "@/server/auth/currentUser";
import { handle, privateJson, readJson } from "@/server/http";
import { careSchema, thoughtIdSchema } from "@/server/validation/schemas";
import { waterThought } from "@/server/services/orchardService";
import { notFound } from "@/server/services/errors";

export const dynamic = "force-dynamic";

/** Water a thought. Idempotent by `idempotencyKey` (spec 5.5, 10). */
export function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return handle(async () => {
    const userId = await currentUserId(request);
    const parsedId = thoughtIdSchema.safeParse((await context.params).id);
    if (!parsedId.success) throw notFound();
    const { idempotencyKey } = await readJson(request, careSchema);
    return privateJson(await waterThought(userId, parsedId.data, idempotencyKey));
  });
}
