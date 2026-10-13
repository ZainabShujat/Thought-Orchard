"use client";

import React, { useRef, useState } from "react";
import { Thought } from "@/types/thought";
import { MAX_THOUGHT_LENGTH } from "@/server/validation/limits";
import { PixelIcon } from "@/components/ui/PixelIcon";

export type WaterStatus = { state: "idle" } | { state: "pending" } | { state: "failed"; message: string };

interface ThoughtActionsProps {
  thought: Thought;
  water: WaterStatus;
  onWater: () => void;
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
export function ThoughtActions({ thought, water, onWater, onEdit, onDelete, onEditingChange }: ThoughtActionsProps) {
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
          It will be deleted permanently, with its watering history. Other trees stay where they are.
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
      {water.state === "failed" && (
        <p role="alert" className="mb-2 text-sm text-[var(--px-danger)]">
          {water.message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="px-btn px-btn--primary"
          onClick={onWater}
          disabled={water.state === "pending"}
          aria-live="polite"
        >
          <PixelIcon name="water" scale={2} />
          {water.state === "pending" ? "Watering…" : water.state === "failed" ? "Try again" : "Water"}
        </button>
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
