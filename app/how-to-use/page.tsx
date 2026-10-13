import type { Metadata } from "next";
import Link from "next/link";
import { getServerUser } from "@/server/auth/session";
import { InfoPage, InfoSection } from "@/components/app/InfoPage";

export const metadata: Metadata = { title: "How to use · Thought Orchard" };
export const dynamic = "force-dynamic";

const STAGES = ["New Thought", "Seedling", "Budding", "Young Tree", "Blossoming", "Flourishing", "Fully Grown"];

/** How to use: planting, caring, growing, moving around. Public. */
export default async function HowToUsePage() {
  const user = await getServerUser().catch(() => null);
  return (
    <InfoPage title="How to use" icon="compass" signedIn={Boolean(user)}>
      <InfoSection title="1. Plant a thought">
        <p>
          In the orchard, press <strong>Plant</strong> at the bottom of the screen, write whatever is on your mind, and
          press <strong>Plant</strong> again. A new tree appears and its letter opens beside it.
        </p>
        <p>Short or long, finished or not: anything up to 2,000 characters.</p>
      </InfoSection>

      <InfoSection title="2. Visit and read your trees">
        <p>
          Walk up to any tree and tap or click it to open its letter: the thought, its growth stage, and when it was
          planted and last watered. From the letter you can <strong>Water</strong>, <strong>Edit</strong> or{" "}
          <strong>Delete</strong> it. Deleting asks twice and can&apos;t be undone.
        </p>
      </InfoSection>

      <InfoSection title="3. Watch it grow">
        <p>Each tree grows through seven stages:</p>
        <ol className="ml-6 list-decimal">
          {STAGES.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p>
          With time alone a tree is fully grown after about two months. Watering it, at most once a day, brings that
          closer to about six weeks. Trees never wilt or shrink.
        </p>
      </InfoSection>

      <InfoSection title="4. Look around">
        <p>
          Press <strong>View</strong> to switch between two ways of seeing your orchard:
        </p>
        <ul className="ml-6 list-disc">
          <li>
            <strong>Immersive:</strong> you stand among the trees at eye level.
          </li>
          <li>
            <strong>Explorer:</strong> you see a small explorer on the paths from above.
          </li>
        </ul>
        <p>
          <strong>On a computer:</strong> W A S D or the up and down arrows to walk, Q and E or the left and right
          arrows to turn, drag to look, and click the ground to walk there. In Explorer, scroll to zoom and right-drag to turn the view.
        </p>
        <p>
          <strong>On a phone or tablet:</strong> tap the ground to walk and drag to look. In Explorer, pinch to zoom
          and twist with two fingers to turn.
        </p>
        <p>
          Lost? Open <strong>More</strong> and choose <strong>Back to the path</strong> to return to the entrance.
        </p>
      </InfoSection>

      <InfoSection title="5. Find a thought again">
        <p>
          The <strong>Notebook</strong> lists every thought you&apos;ve planted and lets you search them. The{" "}
          <strong>Map</strong> shows your orchard from above. From either one, choose a tree to walk straight to it.
        </p>
      </InfoSection>

      <InfoSection title="6. Make it comfortable">
        <p>
          In <strong>Settings</strong> you can switch to a plain, easier-to-read font, reduce motion, choose which view
          the orchard opens in, change your name or password, or delete your account.
        </p>
      </InfoSection>

      <p className="mt-6">
        {user ? (
          <Link href="/orchard" className="px-btn px-btn--primary">
            Go to your orchard
          </Link>
        ) : (
          <Link href="/register" className="px-btn px-btn--primary">
            Plant your first thought
          </Link>
        )}
      </p>
    </InfoPage>
  );
}
