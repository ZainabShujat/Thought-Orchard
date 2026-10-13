"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Thought } from "@/types/thought";
import { computeGrowth } from "@/features/growth/growthModel";
import { openRegionIds } from "@/features/world/worldLayout";
import { OrchardHud } from "@/components/orchard/OrchardHud";
import { PlantThoughtSheet } from "@/components/orchard/PlantThoughtSheet";
import { ThoughtDetailPanel } from "@/components/thoughts/ThoughtDetailPanel";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { useProfile } from "@/components/app/ProfileProvider";
import { authClient } from "@/lib/authClient";
import { useThoughts } from "@/lib/useThoughts";
import type { CareFx } from "@/rendering/trees/ProceduralTree";
import { ViewMode, createExplorerState, headingTo, returnToEntrance } from "@/rendering/movement/explorerState";
import { aimAtTree, frameInExplorer, isNarrowScreen } from "@/rendering/movement/aim";
import { applyPose, loadPose, savePose } from "@/rendering/movement/poseCache";

export function OrchardLoading() {
  return (
    <div className="flex h-full min-h-dvh w-full flex-col items-center justify-center gap-4" role="status">
      <span className="px-bob">
        <PixelIcon name="sprout" scale={6} />
      </span>
      <p className="text-lg">Entering the orchard…</p>
    </div>
  );
}

// Three.js needs the browser, so the canvas is never server-rendered.
const OrchardCanvas = dynamic(() => import("@/rendering/OrchardCanvas").then((mod) => mod.OrchardCanvas), {
  ssr: false,
  loading: OrchardLoading,
});

type Panel = "none" | "plant" | "more";

/** How far from a tree you stand after visiting it or planting it. */
const VISIT_DISTANCE = 4.5;

/** The 3D orchard (spec 6, 20, 22). Client-only. */
export function OrchardView() {
  const router = useRouter();
  const params = useSearchParams();
  const { profile } = useProfile();
  const store = useThoughts();
  const { load, thoughts, entries, serverOffsetMs } = store;

  // Restore where you stood in this tab, or start at the entrance in your preferred view.
  const [initialPose] = useState(() => loadPose());
  const explorerRef = useRef(createExplorerState());
  const [view, setView] = useState<ViewMode>(() => initialPose?.view ?? profile.preferences.startView);
  const viewRef = useRef(view);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(() => (params.get("plant") ? "plant" : "none"));
  const [draft, setDraft] = useState("");
  const [careFx, setCareFx] = useState<Record<string, CareFx>>({});
  const [showHint, setShowHint] = useState(true);
  const handledTreeParam = useRef(false);

  useEffect(() => {
    if (initialPose) applyPose(explorerRef.current, initialPose);
  }, [initialPose]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const rememberPose = useCallback(() => savePose(explorerRef.current, viewRef.current), []);

  useEffect(() => {
    window.addEventListener("pagehide", rememberPose);
    return () => {
      window.removeEventListener("pagehide", rememberPose);
      rememberPose();
    };
  }, [rememberPose]);

  // Development only: expose the movement state for debugging and end-to-end tests.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __orchardExplorer?: unknown }).__orchardExplorer = explorerRef.current;
    }
  }, []);

  const regions = useMemo(() => openRegionIds(thoughts), [thoughts]);
  const selected = entries.find((t) => t.thought._id === selectedId) ?? null;

  /** Stand a few metres from a tree, facing it, and open it. */
  const visit = useCallback(
    (thought: Thought) => {
      const explorer = explorerRef.current;
      const tree = thought.position;
      let dx = explorer.x - tree.x;
      let dz = explorer.z - tree.z;
      const len = Math.hypot(dx, dz);
      if (len < 0.01) {
        dx = 0;
        dz = 1;
      } else {
        dx /= len;
        dz /= len;
      }
      explorer.x = tree.x + dx * VISIT_DISTANCE;
      explorer.z = tree.z + dz * VISIT_DISTANCE;
      explorer.target = null;
      explorer.heading = headingTo(explorer, tree);
      const stage = computeGrowth(thought.createdAt, thought.care, Date.now() + serverOffsetMs).stage;
      if (viewRef.current === "explorer") frameInExplorer(explorer, tree, isNarrowScreen());
      else aimAtTree(explorer, thought, stage, isNarrowScreen());
      setPanel("none");
      setSelectedId(thought._id);
    },
    [serverOffsetMs]
  );

  // Arriving from the Notebook or Map with ?tree=<id> opens that tree.
  useEffect(() => {
    if (handledTreeParam.current || load.state !== "ready") return;
    const id = params.get("tree");
    const plantParam = params.get("plant");
    if (!id && !plantParam) return;
    handledTreeParam.current = true;
    const thought = id ? thoughts.find((t) => t._id === id) : undefined;
    // One-time sync from the URL once the thoughts have loaded; guarded by handledTreeParam.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (thought) visit(thought);
    router.replace("/orchard", { scroll: false });
  }, [load.state, params, thoughts, visit, router]);

  const handlePlant = async (content: string) => {
    const thought = await store.plant(content);
    setDraft("");
    visit(thought);
  };

  const handleWater = async (thought: Thought) => {
    const id = thought._id;
    setCareFx((fx) => ({ ...fx, [id]: { kind: "pending", key: Date.now() } }));
    const outcome = await store.waterThought(id);
    setCareFx((fx) => ({
      ...fx,
      [id]: { kind: outcome ? (outcome.counted ? "counted" : "uncounted") : "failed", key: Date.now() },
    }));
  };

  const handleDelete = async (thought: Thought) => {
    await store.remove(thought._id);
    setSelectedId((current) => (current === thought._id ? null : current));
  };

  const signOut = async () => {
    rememberPose();
    await authClient.signOut();
    window.location.assign("/");
  };

  /** Close the topmost layer first; the Android back button will reuse this (spec 17.6). */
  const closeTopmost = useCallback(() => {
    if (panel !== "none") {
      setPanel("none");
      return true;
    }
    if (selectedId) {
      setSelectedId(null);
      return true;
    }
    return false;
  }, [panel, selectedId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTopmost();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeTopmost]);

  const dialogOpen = panel === "plant";

  return (
    <main className="fixed inset-0 overflow-hidden bg-[var(--px-sky)]">
      <div className="absolute inset-0" aria-hidden={dialogOpen ? true : undefined}>
        {load.state === "ready" ? (
          <OrchardCanvas
            trees={entries}
            openRegionIds={regions}
            selectedId={selectedId}
            onSelect={(t) => setSelectedId(t?._id ?? null)}
            explorer={explorerRef}
            view={view}
            careFx={careFx}
            timeOfDay="golden-afternoon"
            controlsEnabled={!dialogOpen}
            onFirstInteraction={() => setShowHint(false)}
          />
        ) : load.state === "loading" ? (
          <OrchardLoading />
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <div role="alert" className="px-parchment max-w-sm p-5 text-center">
              <p className="mb-3 text-lg">{load.message}</p>
              <button type="button" className="px-btn px-btn--primary" onClick={() => void store.refresh()}>
                Try again
              </button>
            </div>
          </div>
        )}
      </div>

      <OrchardHud
        displayName={profile.displayName}
        thoughtCount={thoughts.length}
        showHint={showHint && !selectedId && load.state === "ready"}
        view={view}
        moreOpen={panel === "more"}
        onOpenPlant={() => setPanel("plant")}
        onToggleView={() => setView((v) => (v === "immersive" ? "explorer" : "immersive"))}
        onBackToPath={() => {
          returnToEntrance(explorerRef.current);
          setSelectedId(null);
        }}
        onToggleMore={() => setPanel((p) => (p === "more" ? "none" : "more"))}
        onSignOut={() => void signOut()}
        onLeave={rememberPose}
      />

      {load.state === "ready" && thoughts.length === 0 && panel === "none" && (
        <div className="pointer-events-none fixed inset-x-0 top-1/3 z-20 flex justify-center px-4">
          <div className="px-parchment pointer-events-auto max-w-sm p-5 text-center">
            <p className="mb-3 text-lg">Your orchard is waiting.</p>
            <button type="button" className="px-btn px-btn--primary" onClick={() => setPanel("plant")}>
              <PixelIcon name="plant" scale={2} />
              Plant your first thought
            </button>
          </div>
        </div>
      )}

      {selected && panel === "none" && (
        <ThoughtDetailPanel
          key={selected.thought._id}
          thought={selected.thought}
          growth={selected.growth}
          water={store.waterStatus(selected.thought._id)}
          onWater={() => void handleWater(selected.thought)}
          onEdit={(content) => store.edit(selected.thought._id, content)}
          onDelete={() => handleDelete(selected.thought)}
          onClose={() => setSelectedId(null)}
        />
      )}

      {panel === "plant" && (
        <PlantThoughtSheet draft={draft} onDraftChange={setDraft} onPlant={handlePlant} onClose={() => setPanel("none")} />
      )}
    </main>
  );
}
