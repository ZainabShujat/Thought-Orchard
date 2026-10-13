"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { getStageLabel } from "@/features/growth/stages";
import { PageShell } from "@/components/app/AppHeader";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { CareHistory, ThoughtActions, TreeHealthNote } from "@/components/thoughts/ThoughtActions";
import { useThoughts } from "@/lib/useThoughts";

/**
 * The Notebook (spec 7.3, 22.3): every thought as a searchable list, and the
 * way to read, visit, water, edit and delete any thought without the 3D world.
 * Newest first.
 */
export default function NotebookPage() {
  const store = useThoughts();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...store.entries]
      .sort((a, b) => b.thought.createdAt.localeCompare(a.thought.createdAt))
      .filter((e) => !q || e.thought.content.toLowerCase().includes(q));
  }, [store.entries, query]);

  return (
    <PageShell title="Notebook">
      <div className="px-parchment p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <label htmlFor="search" className="mb-1 block text-base">
              Search your thoughts
            </label>
            <input
              id="search"
              type="search"
              className="px-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="A word or phrase"
            />
          </div>
          <Link href="/orchard?plant=1" className="px-btn px-btn--primary">
            <PixelIcon name="plant" scale={2} />
            Plant a thought
          </Link>
        </div>

        {store.load.state === "loading" && (
          <p role="status" className="py-6 text-center text-lg">
            Opening your notebook…
          </p>
        )}

        {store.load.state === "error" && (
          <div role="alert" className="py-6 text-center">
            <p className="mb-3 text-lg">{store.load.message}</p>
            <button type="button" className="px-btn px-btn--primary" onClick={() => void store.refresh()}>
              Try again
            </button>
          </div>
        )}

        {store.load.state === "ready" && (
          <>
            <p className="mb-3 text-sm text-[var(--px-ink-soft)]" aria-live="polite">
              {query
                ? `${visible.length} of ${store.entries.length} thoughts match`
                : `${store.entries.length} ${store.entries.length === 1 ? "thought" : "thoughts"} planted`}
            </p>

            {store.entries.length === 0 && (
              <div className="py-6 text-center">
                <p className="mb-3 text-lg">Nothing planted yet.</p>
                <Link href="/orchard?plant=1" className="px-btn px-btn--primary">
                  Plant your first thought
                </Link>
              </div>
            )}

            <ul className="space-y-4">
              {visible.map(({ thought, growth }) => {
                const open = openId === thought._id;
                return (
                  <li key={thought._id} className="border-b-4 border-dashed border-[var(--px-parchment-shade)] pb-4 last:border-b-0">
                    <p className="mb-1 text-sm text-[var(--px-ink-soft)]">
                      {getStageLabel(growth.stage)} · stage {growth.stageNumber} of 7
                    </p>
                    <p className="mb-2 whitespace-pre-wrap text-lg leading-relaxed">{thought.content}</p>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Link href={`/orchard?tree=${thought._id}`} className="px-btn px-btn--primary text-sm">
                        <PixelIcon name="tree" scale={2} />
                        Visit tree
                      </Link>
                      <button
                        type="button"
                        className="px-btn px-btn--ghost text-sm"
                        aria-expanded={open}
                        aria-controls={`tend-${thought._id}`}
                        onClick={() => setOpenId(open ? null : thought._id)}
                      >
                        {open ? "Less" : "Tend"}
                      </button>
                    </div>
                    {open && (
                      <div id={`tend-${thought._id}`} className="mt-2 space-y-3">
                        <CareHistory thought={thought} />
                        <TreeHealthNote growth={growth} />
                        <ThoughtActions
                          thought={thought}
                          growth={growth}
                          care={store.careStatus(thought._id)}
                          onCare={(type) => void store.careFor(thought._id, type)}
                          onEdit={(content) => store.edit(thought._id, content)}
                          onDelete={() => store.remove(thought._id)}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </PageShell>
  );
}
