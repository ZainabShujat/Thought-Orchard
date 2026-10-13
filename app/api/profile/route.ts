import { requireUser } from "@/server/auth/currentUser";
import { handle, privateJson, readJson } from "@/server/http";
import { profileUpdateSchema } from "@/server/validation/schemas";
import { getProfile, updateProfile } from "@/server/services/accountService";

export const dynamic = "force-dynamic";

/** The signed-in user's profile and preferences. */
export function GET(request: Request): Promise<Response> {
  return handle(async () => privateJson({ profile: await getProfile(await requireUser(request)) }));
}

/** Update display name, preferences, or finish onboarding. */
export function PATCH(request: Request): Promise<Response> {
  return handle(async () => {
    const user = await requireUser(request);
    const update = await readJson(request, profileUpdateSchema);
    return privateJson({ profile: await updateProfile(user, update) });
  });
}
