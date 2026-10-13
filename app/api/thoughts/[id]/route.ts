import { currentUserId } from "@/server/auth/currentUser";
import { handle, privateJson, readJson } from "@/server/http";
import { editThoughtSchema, thoughtIdSchema } from "@/server/validation/schemas";
import { deleteThought, editThought, getThought } from "@/server/services/orchardService";
import { notFound } from "@/server/services/errors";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

async function parseId(context: Context): Promise<string> {
  const { id } = await context.params;
  const parsed = thoughtIdSchema.safeParse(id);
  if (!parsed.success) throw notFound();
  return parsed.data;
}

export function GET(request: Request, context: Context): Promise<Response> {
  return handle(async () => {
    const userId = await currentUserId(request);
    return privateJson({ thought: await getThought(userId, await parseId(context)) });
  });
}

/** Edit content only (spec 3.2, 10). */
export function PATCH(request: Request, context: Context): Promise<Response> {
  return handle(async () => {
    const userId = await currentUserId(request);
    const id = await parseId(context);
    const { content } = await readJson(request, editThoughtSchema);
    return privateJson({ thought: await editThought(userId, id, content) });
  });
}

/** Permanent deletion (spec 3.4). 404 after a retry means it is already gone. */
export function DELETE(request: Request, context: Context): Promise<Response> {
  return handle(async () => {
    const userId = await currentUserId(request);
    await deleteThought(userId, await parseId(context));
    return new Response(null, { status: 204 });
  });
}
