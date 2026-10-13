import type { Metadata } from "next";
import { getServerUser } from "@/server/auth/session";
import { SupportContent } from "@/components/support/SupportContent";

export const metadata: Metadata = { title: "Support · Thought Orchard" };
export const dynamic = "force-dynamic";

/**
 * Support (spec 23). Public: reachable with or without an account, and never
 * blocked by a sign-in or database problem.
 */
export default async function SupportPage() {
  const user = await getServerUser().catch(() => null);
  return <SupportContent signedIn={Boolean(user)} />;
}
