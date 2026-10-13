"use client";

import React, { useEffect, useRef, useState } from "react";
import { Thought } from "@/types/thought";
import { GrowthState } from "@/features/growth/growthModel";
import { getStageLabel } from "@/features/growth/stages";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { CareHistory, ThoughtActions, WaterStatus } from "@/components/thoughts/ThoughtActions";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

interface ThoughtDetailPanelProps {
  thought: Thought;
  growth: GrowthState;
  water: WaterStatus;
  onWater: () => void;
  onEdit: (content: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

const CHARS_PER_TICK = 2;
const TICK_MS = 30;

/**
 * Tree inspection (spec 22.3): the thought as a letter, its stage and care
 * history, and Water, Edit and Delete. Text types out a few characters at a
 * time; tapping it shows it all; reduced motion shows it at once. Screen
 * readers get the full text immediately.
 *
 * Mount with `key={thought._id}` so the reveal restarts per thought.
 */
export function ThoughtDetailPanel({ thought, growth, water, onWater, onEdit, onDelete, onClose }: ThoughtDetailPanelProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [shown, setShown] = useState(0);
  const [editing, setEditing] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const total = thought.content.length;
  const visible = reducedMotion ? total : Math.min(shown, total);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    if (reducedMotion || shown >= total) return;
    const id = window.setTimeout(() => setShown((n) => n + CHARS_PER_TICK), TICK_MS);
    return () => window.clearTimeout(id);
  }, [shown, total, reducedMotion]);

  const titleId = `thought-${thought._id}-title`;

  return (
    <section
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-labelledby={titleId}
      // Phones: above the toolbar. Wider screens: to the right, so the tree stays visible in the middle.
      className="px-focus pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+132px)] z-20 flex justify-center px-3 outline-none md:inset-x-auto md:right-4 md:top-24 md:bottom-auto"
    >
      <div className="px-parchment px-rise pointer-events-auto max-h-[45dvh] w-full max-w-lg overflow-y-auto p-5 md:max-h-[calc(100dvh-16rem)] md:w-[24rem]">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg leading-tight">
              {getStageLabel(growth.stage)}
              <span className="ml-2 text-sm opacity-75">stage {growth.stageNumber} of 7</span>
            </h2>
            <CareHistory thought={thought} />
          </div>
          <button type="button" className="px-btn px-btn--ghost" aria-label="Close thought" onClick={onClose}>
            <PixelIcon name="close" scale={3} />
          </button>
        </div>

        {!editing && (
          <>
            <p className="sr-only">{thought.content}</p>
            <p
              aria-hidden="true"
              className="mb-4 min-h-[2lh] cursor-pointer whitespace-pre-wrap text-xl leading-relaxed"
              onClick={() => setShown(total)}
            >
              {thought.content.slice(0, visible)}
              {visible < total && <span className="px-bob inline-block">▌</span>}
            </p>
          </>
        )}

        <ThoughtActions
          thought={thought}
          water={water}
          onWater={onWater}
          onEdit={onEdit}
          onDelete={onDelete}
          onEditingChange={setEditing}
        />
      </div>
    </section>
  );
}
