"use client";

import React, { useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { useFocusTrap } from "@/lib/useFocusTrap";
import type { ViewMode } from "@/rendering/movement/explorerState";

interface OrchardHudProps {
  displayName: string;
  thoughtCount: number;
  showHint: boolean;
  view: ViewMode;
  moreOpen: boolean;
  onOpenPlant: () => void;
  onToggleView: () => void;
  onBackToPath: () => void;
  onToggleMore: () => void;
  onSignOut: () => void;
  /** Called before leaving for another page, so the current position is remembered. */
  onLeave: () => void;
}

const COARSE_QUERY = "(pointer: coarse)";

function subscribeCoarse(onChange: () => void) {
  const mql = window.matchMedia(COARSE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function useCoarsePointer(): boolean {
  return useSyncExternalStore(
    subscribeCoarse,
    () => window.matchMedia(COARSE_QUERY).matches,
    () => true
  );
}

const HINTS: Record<ViewMode, { touch: string; mouse: string }> = {
  immersive: {
    touch: "Drag to look · Tap the ground to walk · Tap a tree",
    mouse: "W A S D to walk · Drag to look · Click the ground to walk · Click a tree",
  },
  explorer: {
    touch: "Tap to walk · Pinch to zoom · Twist to turn · Tap a tree",
    mouse: "W A S D or click to walk · Scroll to zoom · Right-drag to turn · Click a tree",
  },
};

function MoreMenu({
  onBackToPath,
  onSignOut,
  onLeave,
  onClose,
}: {
  onBackToPath: () => void;
  onSignOut: () => void;
  onLeave: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref);
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="More"
      className="px-parchment px-rise pointer-events-auto absolute bottom-full right-0 mb-4 flex max-h-[70dvh] w-60 flex-col gap-2 overflow-y-auto p-4"
    >
      <button
        type="button"
        className="px-btn px-btn--ghost justify-start"
        onClick={() => {
          onBackToPath();
          onClose();
        }}
      >
        <PixelIcon name="path" scale={2} />
        Back to the path
      </button>
      <Link href="/settings" className="px-btn px-btn--ghost justify-start" onClick={onLeave}>
        <PixelIcon name="gear" scale={2} />
        Settings
      </Link>
      <Link href="/support" className="px-btn px-btn--ghost justify-start" onClick={onLeave}>
        <PixelIcon name="heart" scale={2} />
        Support
      </Link>
      <Link href="/how-to-use" className="px-btn px-btn--ghost justify-start" onClick={onLeave}>
        <PixelIcon name="compass" scale={2} />
        How to use
      </Link>
      <Link href="/about" className="px-btn px-btn--ghost justify-start" onClick={onLeave}>
        <PixelIcon name="sprout" scale={2} />
        About
      </Link>
      <Link href="/navigation" className="px-btn px-btn--ghost justify-start" onClick={onLeave}>
        <PixelIcon name="more" scale={2} />
        All pages
      </Link>
      <button type="button" className="px-btn px-btn--ghost justify-start" onClick={onSignOut}>
        <PixelIcon name="back" scale={2} />
        Log out
      </button>
      <button type="button" className="px-btn px-btn--ghost justify-start" onClick={onClose}>
        Close
      </button>
    </div>
  );
}

/**
 * Orchard HUD (spec 22.1): a small wooden sign at the top and the main
 * actions in a bottom toolbar within thumb reach (spec 17.6).
 */
export function OrchardHud({
  displayName,
  thoughtCount,
  showHint,
  view,
  moreOpen,
  onOpenPlant,
  onToggleView,
  onBackToPath,
  onToggleMore,
  onSignOut,
  onLeave,
}: OrchardHudProps) {
  const coarse = useCoarsePointer();
  const nextView = view === "immersive" ? "explorer" : "immersive";

  return (
    <>
      <header className="safe-top safe-x pointer-events-none fixed inset-x-0 top-0 z-30 flex flex-col items-start gap-3">
        <div className="px-wood pointer-events-auto flex items-center gap-3 px-4 py-2">
          <PixelIcon name="tree" scale={3} />
          <div>
            <h1 className="text-base leading-tight">{displayName ? `${displayName}'s orchard` : "Thought Orchard"}</h1>
            <p className="text-sm leading-tight opacity-90">
              {thoughtCount} {thoughtCount === 1 ? "tree" : "trees"} · {view === "immersive" ? "Immersive" : "Explorer"}
            </p>
          </div>
        </div>
        {showHint && (
          <p className="px-parchment pointer-events-none px-3 py-2 text-sm leading-snug">
            {coarse ? HINTS[view].touch : HINTS[view].mouse}
          </p>
        )}
      </header>

      <nav
        aria-label="Orchard actions"
        className="safe-bottom safe-x pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center"
      >
        <div className="px-wood pointer-events-auto relative flex items-end gap-0 px-1 py-2 sm:gap-3 sm:px-3 sm:py-3">
          <Link href="/notebook" className="px-btn flex-col px-1 sm:px-2" onClick={onLeave}>
            <PixelIcon name="journal" scale={3} />
            <span className="text-xs sm:text-sm">Notebook</span>
          </Link>
          <Link href="/map" className="px-btn flex-col px-1 sm:px-2" onClick={onLeave}>
            <PixelIcon name="map" scale={3} />
            <span className="text-xs sm:text-sm">Map</span>
          </Link>
          <button type="button" className="px-btn px-btn--primary flex-col px-2 sm:px-4" onClick={onOpenPlant}>
            <PixelIcon name="plant" scale={4} />
            <span className="text-sm sm:text-base">Plant</span>
          </button>
          <button
            type="button"
            className="px-btn flex-col px-1 sm:px-2"
            onClick={onToggleView}
            aria-label={`View: switch to ${nextView === "explorer" ? "Explorer" : "Immersive"}`}
          >
            <PixelIcon name={nextView === "explorer" ? "explorer" : "eye"} scale={3} />
            <span className="text-xs sm:text-sm" aria-hidden="true">
              View
            </span>
          </button>
          <button
            type="button"
            className="px-btn flex-col px-1 sm:px-2"
            onClick={onToggleMore}
            aria-expanded={moreOpen}
            aria-label="More: path, settings, support, guides, log out"
          >
            <PixelIcon name="more" scale={3} />
            <span className="text-xs sm:text-sm" aria-hidden="true">
              More
            </span>
          </button>
          {moreOpen && (
            <MoreMenu onBackToPath={onBackToPath} onSignOut={onSignOut} onLeave={onLeave} onClose={onToggleMore} />
          )}
        </div>
      </nav>
    </>
  );
}
