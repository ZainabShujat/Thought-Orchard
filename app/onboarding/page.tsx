import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/server/auth/session";
import { getProfile } from "@/server/services/accountService";
import { OnboardingForm } from "@/components/auth/OnboardingForm";

export const metadata: Metadata = { title: "Welcome · Thought Orchard" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");
  const profile = await getProfile(user);
  if (profile.onboarded) redirect("/orchard");

  return (
    <main className="px-sky-bands safe-top safe-bottom safe-x flex min-h-dvh items-center justify-center py-8">
      <div className="px-parchment w-full max-w-lg p-6">
        <OnboardingForm profile={profile} />
      </div>
    </main>
  );
}
