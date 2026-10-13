import React from "react";
import Link from "next/link";
import { PixelIcon } from "@/components/ui/PixelIcon";
import type { PixelIconName } from "@/components/ui/pixelIcons";
import { SiteMenu } from "@/components/app/SiteMenu";

/**
 * Public reading pages (About, How to use, All pages): a top bar with the
 * home link and the ⋯ menu, and the text on parchment.
 */
export function InfoPage({
  title,
  icon,
  signedIn,
  children,
}: {
  title: string;
  icon: PixelIconName;
  signedIn: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="px-sky-bands min-h-dvh">
      <header className="safe-top safe-x sticky top-0 z-30 pb-3">
        <div className="px-wood flex items-center justify-between gap-2 px-3 py-2">
          <Link href="/" className="px-focus flex items-center gap-2 text-lg leading-tight">
            <PixelIcon name="tree" scale={3} />
            Thought Orchard
          </Link>
          <div className="flex items-center gap-1">
            {signedIn ? (
              <Link href="/orchard" className="px-btn px-btn--ghost px-2 py-1 text-sm">
                Orchard
              </Link>
            ) : (
              <Link href="/login" className="px-btn px-btn--ghost px-2 py-1 text-sm">
                Log in
              </Link>
            )}
            <SiteMenu signedIn={signedIn} />
          </div>
        </div>
      </header>
      <main id="main" className="safe-x safe-bottom mx-auto w-full max-w-2xl pb-10">
        <article className="px-parchment p-6">
          <div className="mb-5 flex items-center gap-3">
            <PixelIcon name={icon} scale={4} />
            <h1 className="text-2xl">{title}</h1>
          </div>
          {children}
        </article>
      </main>
    </div>
  );
}

/** A titled section of an info page. */
export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <h2 className="mb-2 text-xl">{title}</h2>
      <div className="flex flex-col gap-3 text-base leading-relaxed">{children}</div>
    </section>
  );
}
