"use client";

import React, { useRef, useState } from "react";
import { Thought } from "@/types/thought";
import { MAX_THOUGHT_LENGTH } from "@/server/validation/limits";
import { PixelIcon } from "@/components/ui/PixelIcon";
import type { PixelIconName } from "@/components/ui/pixelIcons";
import { CareType, GrowthState, ROOTING_WATERING_DAYS } from "@/features/growth/growthModel";

export type CareStatus =
  | { state: "idle" }
  | { state: "pending"; type: CareType }
  | { state: "failed"; type: CareType; message: string };

const CARE_BUTTONS: { type: CareType; label: string; busy: string; icon: PixelIconName; title: string }[] = [
  { type: "water", label: "Water", busy: "Watering…", icon: "water", title: "Water: it resonated. Keeps the tree alive." },
  { type: "sunlight", label: "Sunlight", busy: "Shining…", icon: "sun", title: "Sunlight: joy and hope. Brings blossoms." },
  { type: "wind", label: "Wind", busy: "Breezing…", icon: "wind", title: "Wind: it made you think. Bends branches, deepens roots." },
];

/** One gentle line about how the tree is doing: thirsty, faded, rooted, or nearly grown. */
export function TreeHealthNote({ growth }: { growth: GrowthState }) {
  let text: string | null = null;
  if (growth.health === "dead") {
    text = "This tree has faded. Its thought is still here, safe to read.";
  } else if (growth.health === "weak") {
    text = "This tree is thirsty and has stopped growing. Water it to wake it up; it will drop a stage as it recovers.";
  } else if (growth.rooted) {
    text = "Rooted. This tree will never fade.";
  } else if (growth.daysUntilWeak !== null && growth.daysUntilWeak <= 2) {
    const d = Math.max(1, growth.daysUntilWeak);
    text = `Getting thirsty. Water it within ${d} ${d === 1 ? "day" : "days"} to keep it growing.`;
  } else if (growth.stage === "flourishing") {
    const left = Math.max(0, ROOTING_WATERING_DAYS - growth.countedWaterings);
    text = left > 0 ? `Water it on ${left} more ${left === 1 ? "day" : "days"} and it can become Fully Grown.` : null;
  }
  if (!text) return null;
  return (
    <p className={`text-sm ${growth.health === "healthy" ? "text-[var(--px-ink-soft)]" : "text-[var(--px-ink)]"}`}>{text}</p>
  );
}

interface ThoughtActionsProps {
  thought: Thought;
  growth: GrowthState;
  care: CareStatus;
  onCare: (type: CareType) => void;
  onEdit: (content: string) => Promise<void>;
  onDelete: () => Promise<void>;
  /** Called when the user starts or stops editing, so the panel can hide the text. */
  onEditingChange?: (editing: boolean) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** Planted, edited and watered dates (spec 4.5). Dates only: no totals or scores. */
export function CareHistory({ thought }: { thought: Thought }) {
  const waterings = thought.care.filter((c) => c.type === "water");
  const last = waterings[waterings.length - 1];
  const edited = thought.updatedAt !== thought.createdAt;
  return (
    <div className="text-sm text-[var(--px-ink-soft)]">
      <p>
        Planted {formatDate(thought.createdAt)}
        {edited && <> · edited {formatDate(thought.updatedAt)}</>}
      </p>
      <p>{last ? <>Last watered {formatDate(last.createdAt)}</> : <>Not watered yet</>}</p>
      {waterings.length > 1 && (
        <details className="mt-1">
          <summary className="px-focus cursor-pointer">Watering dates</summary>
          <ul className="mt-1 max-h-24 overflow-y-auto pl-4">
            {[...waterings].reverse().map((w) => (
              <li key={w._id}>{formatDate(w.createdAt)}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/**
 * Water, edit and delete for one thought (spec 3.4, 5.5). Delete always takes
 * two deliberate steps. Errors keep the user's text and offer a retry.
 */
export function ThoughtActions({ thought, growth, care, onCare, onEdit, onDelete, onEditingChange }: ThoughtActionsProps) {
  const [mode, setMode] = useState<"view" | "edit" | "confirmDelete">("view");
  const [draft, setDraft] = useState(thought.content);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const changeMode = (next: typeof mode) => {
    setMode(next);
    setError(null);
    onEditingChange?.(next === "edit");
    if (next === "edit") {
      setDraft(thought.content);
      requestAnimationFrame(() => editRef.current?.focus());
    }
    if (next === "confirmDelete") requestAnimationFrame(() => confirmRef.current?.focus());
  };

  const run = async (action: () => Promise<void>, after: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      after();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (mode === "edit") {
    const trimmed = draft.trim();
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!trimmed) {
            setError("A thought can't be empty.");
            return;
          }
          run(() => onEdit(trimmed), () => changeMode("view"));
        }}
      >
        <label htmlFor={`edit-${thought._id}`} className="sr-only">
          Edit your thought
        </label>
        <textarea
          id={`edit-${thought._id}`}
          ref={editRef}
          value={draft}
          rows={4}
          maxLength={MAX_THOUGHT_LENGTH}
          onChange={(e) => setDraft(e.target.value)}
          className="px-input"
        />
        {error && (
          <p role="alert" className="mt-2 text-sm text-[var(--px-danger)]">
            {error}
          </p>
        )}
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button type="button" className="px-btn px-btn--ghost" onClick={() => changeMode("view")} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="px-btn px-btn--primary" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    );
  }

  if (mode === "confirmDelete") {
    return (
      <div role="group" aria-labelledby={`delete-${thought._id}`}>
        <p id={`delete-${thought._id}`} className="mb-1 text-base">
          Remove this thought and its tree?
        </p>
        <p className="mb-3 text-sm text-[var(--px-ink-soft)]">
          It will be deleted permanently, with its care history. Other trees stay where they are.
        </p>
        {error && (
          <p role="alert" className="mb-2 text-sm text-[var(--px-danger)]">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <button
            ref={confirmRef}
            type="button"
            className="px-btn px-btn--ghost"
            onClick={() => changeMode("view")}
            disabled={busy}
          >
            Keep it
          </button>
          <button
            type="button"
            className="px-btn px-btn--danger"
            onClick={() => run(onDelete, () => undefined)}
            disabled={busy}
          >
            {busy ? "Removing…" : "Remove permanently"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {care.state === "failed" && (
        <p role="alert" className="mb-2 text-sm text-[var(--px-danger)]">
          {care.message}
        </p>
      )}
      {growth.health !== "dead" && (
        <div className="mb-2 flex flex-wrap gap-2" role="group" aria-label="Care">
          {CARE_BUTTONS.map((b) => {
            const pending = care.state === "pending" && care.type === b.type;
            const failed = care.state === "failed" && care.type === b.type;
            return (
              <button
                key={b.type}
                type="button"
                title={b.title}
                className={`px-btn ${b.type === "water" ? "px-btn--primary" : "px-btn--ghost"}`}
                onClick={() => onCare(b.type)}
                disabled={care.state === "pending"}
                aria-live="polite"
              >
                <PixelIcon name={b.icon} scale={2} />
                {pending ? b.busy : failed ? "Try again" : b.label}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="px-btn px-btn--ghost" onClick={() => changeMode("edit")}>
          <PixelIcon name="edit" scale={2} />
          Edit
        </button>
        <button type="button" className="px-btn px-btn--ghost" onClick={() => changeMode("confirmDelete")}>
          <PixelIcon name="remove" scale={2} />
          Delete
        </button>
      </div>
    </div>
  );
}
