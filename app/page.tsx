import Link from "next/link";
import { getServerUser } from "@/server/auth/session";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { LandingScene } from "@/components/landing/LandingScene";
import { SiteMenu } from "@/components/app/SiteMenu";

export const dynamic = "force-dynamic";

/**
 * Landing page (spec 22.1; references 07, 08): a live pixel view down a path
 * to a glowing thought-tree, the title above it, and two parchment buttons.
 */
export default async function HomePage() {
  // The landing page stays up even if the session can't be checked.
  const user = await getServerUser().catch(() => null);

  return (
    <div className="landing relative flex min-h-dvh flex-col overflow-hidden">
      {/* Shown until (or instead of, without WebGL) the live scene. */}
      <div className="px-sky-bands absolute inset-0" aria-hidden="true" />
      <LandingScene />

      <header className="safe-x relative z-20 flex items-center justify-end gap-1 bg-[var(--px-cream)]/90 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] shadow-[0_4px_0_0_rgba(59,36,23,0.35)]">
        <Link href="/support" className="px-focus mr-auto px-3 py-2 text-base text-[var(--px-ink)] hover:underline">
          Support
        </Link>
        {user ? (
          <Link href="/settings" className="px-focus px-3 py-2 text-base text-[var(--px-ink)] hover:underline">
            {user.name || "Settings"}
          </Link>
        ) : (
          <>
            <Link href="/login" className="px-focus px-3 py-2 text-base text-[var(--px-ink)] hover:underline">
              Log in
            </Link>
            <Link href="/register" className="px-focus px-3 py-2 text-base text-[var(--px-ink)] hover:underline">
              Sign up
            </Link>
          </>
        )}
        <SiteMenu signedIn={Boolean(user)} />
      </header>

      <main id="main" className="safe-x relative z-10 flex flex-1 flex-col items-center px-4 text-center">
        <h1 className="landing-title mt-[9vh] text-6xl leading-[0.95] sm:mt-[11vh] sm:text-7xl md:text-8xl">
          Thought
          <br className="sm:hidden" /> Orchard
        </h1>

        {/* The tree in the scene sits here; the buttons stand on the path in front of it. */}
        <div className="flex-1" />

        <div className="mb-[6vh] flex w-full max-w-md flex-col gap-4">
          <Link href={user ? "/orchard" : "/register"} className="px-btn landing-btn px-6 py-4 text-2xl">
            <PixelIcon name="explorer" scale={4} />
            Enter forest
          </Link>
          <Link href={user ? "/map" : "/login"} className="px-btn landing-btn px-6 py-4 text-2xl">
            <PixelIcon name="map" scale={4} />
            View map
          </Link>
        </div>

        <p className="landing-tagline mb-2 text-lg sm:text-xl">Step into a quiet place for your thoughts</p>
        <nav aria-label="Guides" className="landing-tagline safe-bottom mb-4 flex flex-wrap justify-center gap-x-4 text-base">
          <Link href="/about" className="px-focus underline">
            About
          </Link>
          <Link href="/how-to-use" className="px-focus underline">
            How to use
          </Link>
          <Link href="/navigation" className="px-focus underline">
            All pages
          </Link>
        </nav>
      </main>
    </div>
  );
}
