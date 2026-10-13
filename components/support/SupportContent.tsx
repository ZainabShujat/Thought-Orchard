"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { PixelIcon } from "@/components/ui/PixelIcon";
import {
  INTERNATIONAL_DIRECTORY,
  SUPPORT_RESOURCES,
  countryFromLanguages,
} from "@/features/support/resources";

function subscribe() {
  return () => {};
}

/**
 * Support page (spec 23). Always reachable, never triggered by what anyone
 * writes, and not tracked. The country comes from the device's language
 * settings and can be changed here.
 */
export function SupportContent({ signedIn }: { signedIn: boolean }) {
  const detected = useSyncExternalStore(
    subscribe,
    () => countryFromLanguages(navigator.languages ?? [navigator.language]),
    () => null
  );
  const [chosen, setChosen] = useState<string | null>(null);
  const country = chosen ?? detected ?? "";
  const resources = SUPPORT_RESOURCES[country];

  return (
    <main className="px-sky-bands safe-top safe-bottom safe-x min-h-dvh py-8">
      <div className="px-parchment mx-auto max-w-xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <PixelIcon name="heart" scale={4} />
          <h1 className="text-2xl">Support</h1>
        </div>
        <p className="mb-2 text-lg leading-relaxed">If a thought feels heavy to hold alone, support exists.</p>
        <p className="mb-6 text-base text-[var(--px-ink-soft)]">
          You don&apos;t have to use these. They&apos;re just here. Thought Orchard never reads your thoughts to decide
          anything about you.
        </p>

        <label htmlFor="country" className="mb-1 block text-sm">
          Country
        </label>
        <select
          id="country"
          className="px-input mb-6"
          value={resources ? country : ""}
          onChange={(e) => setChosen(e.target.value)}
        >
          <option value="">Another country</option>
          {Object.entries(SUPPORT_RESOURCES).map(([code, c]) => (
            <option key={code} value={code}>
              {c.name}
            </option>
          ))}
        </select>

        {resources ? (
          <>
            <div className="mb-5 border-4 border-[var(--px-danger)] bg-[var(--px-cream)] p-4">
              <p className="text-base">
                In immediate danger, call{" "}
                <a className="px-focus underline" href={`tel:${resources.emergency.number}`}>
                  {resources.emergency.number}
                </a>
                .
              </p>
              <p className="text-sm text-[var(--px-ink-soft)]">{resources.emergency.note}</p>
            </div>
            <ul className="space-y-5">
              {resources.resources.map((r) => (
                <li key={r.name}>
                  <h2 className="text-lg">{r.name}</h2>
                  <p className="mb-1 text-base leading-relaxed">{r.description}</p>
                  {r.phone && (
                    <p className="text-base">
                      Call{" "}
                      <a className="px-focus underline" href={`tel:${r.phone}`}>
                        {r.phoneLabel ?? r.phone}
                      </a>
                      {r.hours && <> · {r.hours}</>}
                    </p>
                  )}
                  {r.url && (
                    <a className="px-focus text-sm underline" href={r.url} target="_blank" rel="noreferrer">
                      Website
                    </a>
                  )}
                  <p className="mt-1 text-xs text-[var(--px-ink-soft)]">Checked {r.verifiedOn}</p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div>
            <h2 className="text-lg">{INTERNATIONAL_DIRECTORY.name}</h2>
            <p className="mb-1 text-base leading-relaxed">{INTERNATIONAL_DIRECTORY.description}</p>
            <a className="px-focus underline" href={INTERNATIONAL_DIRECTORY.url} target="_blank" rel="noreferrer">
              findahelpline.com
            </a>
            <p className="mt-3 text-base">If you are in immediate danger, call your local emergency number.</p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={signedIn ? "/orchard" : "/"} className="px-btn px-btn--primary">
            <PixelIcon name="tree" scale={2} />
            {signedIn ? "Back to the orchard" : "Back to the entrance"}
          </Link>
        </div>
      </div>
    </main>
  );
}
