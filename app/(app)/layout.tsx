import { requireOnboardedUser } from "@/server/auth/session";
import { ProfileProvider } from "@/components/app/ProfileProvider";

export const dynamic = "force-dynamic";

/**
 * Signed-in pages: Orchard, Notebook, Map, Settings. The session is checked
 * on the server for every request; no session goes to sign-in, and an
 * account that hasn't finished onboarding goes to onboarding.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireOnboardedUser();
  return <ProfileProvider initial={profile}>{children}</ProfileProvider>;
}
