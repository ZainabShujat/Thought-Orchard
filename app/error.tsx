"use client";

import Link from "next/link";

/** Shown when a page fails to load (for example, the database is unreachable). */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="px-sky-bands safe-x flex min-h-dvh items-center justify-center p-6">
      <div role="alert" className="px-parchment max-w-sm p-6 text-center">
        <h1 className="mb-2 text-2xl">Something went wrong</h1>
        <p className="mb-4 text-base">The orchard couldn&apos;t be reached just now. Your thoughts are safe.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" className="px-btn px-btn--primary" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="px-btn px-btn--ghost">
            Entrance
          </Link>
        </div>
      </div>
    </main>
  );
}
