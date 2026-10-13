import type { Metadata } from "next";
import Link from "next/link";
import { getServerUser } from "@/server/auth/session";
import { InfoPage, InfoSection } from "@/components/app/InfoPage";

export const metadata: Metadata = { title: "About · Thought Orchard" };
export const dynamic = "force-dynamic";

/** About: what Thought Orchard is, and what it isn't. Public. */
export default async function AboutPage() {
  const user = await getServerUser().catch(() => null);
  return (
    <InfoPage title="About" icon="sprout" signedIn={Boolean(user)}>
      <InfoSection title="What if ideas were places instead of posts?">
        <p>
          Thought Orchard is a quiet forest for your thoughts. Each thought you write is planted as a tree. It gets its
          own spot in the orchard and stays there, so you can walk back to it whenever you like.
        </p>
        <p>
          A thought doesn&apos;t have to perform here. It doesn&apos;t need a title, a tag, or anyone&apos;s approval.
          It just needs somewhere to land.
        </p>
      </InfoSection>

      <InfoSection title="Thoughts grow slowly">
        <p>
          Every tree starts as a New Thought and grows through seven stages to Fully Grown. Time does most of the work.
          Watering a tree now and then helps it along. There&apos;s no rush and nothing to keep up with.
        </p>
      </InfoSection>

      <InfoSection title="What it isn't">
        <p>
          It isn&apos;t a social network. There are no likes, followers, comments, streaks, or rankings, and nothing
          here decides which thought deserves attention.
        </p>
      </InfoSection>

      <InfoSection title="Your thoughts are yours">
        <p>
          Your orchard is private to your account. Nobody else can see your thoughts, and you can edit or permanently
          delete any of them, or your whole account, from Settings.
        </p>
      </InfoSection>

      <InfoSection title="If a thought feels heavy">
        <p>
          You don&apos;t have to hold it alone. The <Link href="/support" className="underline">Support</Link> page
          lists helplines, starting with India.
        </p>
      </InfoSection>

      <p className="mt-6">
        New here? Read <Link href="/how-to-use" className="underline">How to use</Link>, or see{" "}
        <Link href="/navigation" className="underline">all pages</Link>.
      </p>
    </InfoPage>
  );
}
