"use client";

import React, { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { buildMapModel } from "@/features/world/mapModel";
import { GROWTH_STAGES, getStageLabel } from "@/features/growth/stages";
import { PageShell } from "@/components/app/AppHeader";
import { MAP_STAGE_FILL, OrchardMap } from "@/components/map/OrchardMap";
import { useThoughts } from "@/lib/useThoughts";
import { loadPoseRaw, parsePose } from "@/rendering/movement/poseCache";

function subscribe() {
  return () => {};
}

/**
 * The Map (spec 20.5): drawn from the same world layout and stored tree
 * positions as the 3D orchard. Tap a tree to visit it. A text list below is
 * the accessible alternative.
 */
export default function MapPage() {
  const store = useThoughts();
  const [extent, setExtent] = useState<"open" | "all">("open");
  // Per-tab "you were here" from the orchard; not stored anywhere else.
  const poseRaw = useSyncExternalStore(subscribe, loadPoseRaw, () => null);
  const pose = useMemo(() => parsePose(poseRaw), [poseRaw]);

  const model = useMemo(
    () =>
      buildMapModel(
        store.entries.map((e) => ({
          _id: e.thought._id,
          position: e.thought.position,
          regionId: e.thought.regionId,
          stage: e.growth.stage,
        })),
        pose ? { x: pose.x, z: pose.z, heading: pose.heading } : null
      ),
    [store.entries, pose]
  );
  const excerpts = useMemo(
    () => Object.fromEntries(store.entries.map((e) => [e.thought._id, e.thought.content.slice(0, 60)])),
    [store.entries]
  );

  return (
    <PageShell title="Map">
      <div className="px-parchment p-4 sm:p-6">
        {store.load.state === "loading" && (
          <p role="status" className="py-6 text-center text-lg">
            Unfolding the map…
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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-base">
                {model.trees.length} {model.trees.length === 1 ? "tree" : "trees"} · tap one to visit it
              </p>
              <div role="group" aria-label="Map extent" className="flex gap-1">
                <button
                  type="button"
                  className={`px-btn text-sm ${extent === "open" ? "px-btn--primary" : "px-btn--ghost"}`}
                  aria-pressed={extent === "open"}
                  onClick={() => setExtent("open")}
                >
                  Your grove
                </button>
                <button
                  type="button"
                  className={`px-btn text-sm ${extent === "all" ? "px-btn--primary" : "px-btn--ghost"}`}
                  aria-pressed={extent === "all"}
                  onClick={() => setExtent("all")}
                >
                  Whole forest
                </button>
              </div>
            </div>

            <div className="border-4 border-[var(--px-ink-soft)]">
              <OrchardMap model={model} excerpts={excerpts} extent={extent} youWereHere={model.explorer} />
            </div>

            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Legend">
              {GROWTH_STAGES.map((s, i) => (
                <li key={s.id} className="flex items-center gap-1">
                  <span aria-hidden="true" className="inline-block h-3 w-3 border-2 border-[var(--px-ink)]" style={{ background: MAP_STAGE_FILL[i] }} />
                  {s.label}
                </li>
              ))}
              {model.explorer && (
                <li className="flex items-center gap-1">
                  <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full border-2 border-[var(--px-ink)] bg-[var(--px-amber)]" />
                  Where you last stood
                </li>
              )}
            </ul>

            {model.trees.length === 0 ? (
              <div className="py-6 text-center">
                <p className="mb-3 text-lg">No trees yet. Your first thought will grow at the heart of the grove.</p>
                <Link href="/orchard?plant=1" className="px-btn px-btn--primary">
                  Plant a thought
                </Link>
              </div>
            ) : (
              <details className="mt-4">
                <summary className="px-focus cursor-pointer text-base">Trees as a list</summary>
                <ul className="mt-2 space-y-1">
                  {store.entries.map((e) => (
                    <li key={e.thought._id}>
                      <Link href={`/orchard?tree=${e.thought._id}`} className="px-focus underline">
                        {getStageLabel(e.growth.stage)}: {e.thought.content.slice(0, 80)}
                      </Link>{" "}
                      <span className="text-sm text-[var(--px-ink-soft)]">
                        ({Math.round(e.thought.position.x)}, {Math.round(e.thought.position.z)})
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
