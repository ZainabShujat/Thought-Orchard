import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser, SessionUser } from "@/server/auth/currentUser";
import { getProfile } from "@/server/services/accountService";
import type { Profile } from "@/types/profile";

/** Session lookup for server components and layouts. */
export async function getServerUser(): Promise<SessionUser | null> {
  return getSessionUser(new Headers(await headers()));
}

/**
 * For pages that need an account: no session goes to sign-in; an account
 * that hasn't finished onboarding goes to onboarding.
 */
export async function requireOnboardedUser(): Promise<{ user: SessionUser; profile: Profile }> {
  const user = await getServerUser();
  if (!user) redirect("/login");
  const profile = await getProfile(user);
  if (!profile.onboarded) redirect("/onboarding");
  return { user, profile };
}
