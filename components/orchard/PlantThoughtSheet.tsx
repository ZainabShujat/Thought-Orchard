"use client";

import React, { useRef, useState } from "react";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { MAX_THOUGHT_LENGTH } from "@/server/validation/limits";
import { useFocusTrap } from "@/lib/useFocusTrap";

interface PlantThoughtSheetProps {
  /** Draft text, owned by the parent so closing or a failed save never loses it. */
  draft: string;
  onDraftChange: (value: string) => void;
  /** Resolves when the server confirms; rejects with a user-facing message. */
  onPlant: (content: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Journal page for writing a new thought (spec 3.1, 18.6). Success is shown
 * only after the server confirms. A failed save keeps the draft and offers
 * to try again.
 */
export function PlantThoughtSheet({ draft, onDraftChange, onPlant, onClose }: PlantThoughtSheetProps) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useFocusTrap(dialogRef, textareaRef);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("Write a thought before planting it.");
      textareaRef.current?.focus();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onPlant(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "It couldn't be planted. Your words are still here.");
      setSaving(false);
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="plant-title"
      className="safe-top safe-bottom safe-x fixed inset-0 z-40 flex items-end justify-center bg-[#3b2417]/50 sm:items-center"
    >
      <form onSubmit={handleSubmit} className="px-parchment px-rise w-full max-w-lg p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PixelIcon name="sprout" scale={3} />
            <h2 id="plant-title" className="text-lg">
              Plant a thought
            </h2>
          </div>
          <button type="button" className="px-btn px-btn--ghost" aria-label="Close, keeping your draft" onClick={onClose}>
            <PixelIcon name="close" scale={3} />
          </button>
        </div>

        <label htmlFor="plant-text" className="sr-only">
          Your thought
        </label>
        <textarea
          id="plant-text"
          ref={textareaRef}
          value={draft}
          rows={5}
          maxLength={MAX_THOUGHT_LENGTH}
          onChange={(e) => {
            onDraftChange(e.target.value);
            if (error) setError(null);
          }}
          placeholder="What's on your mind? Unfinished ideas are welcome."
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "plant-error" : "plant-help"}
          className="px-input"
          disabled={saving}
        />

        {error ? (
          <p id="plant-error" role="alert" className="mt-2 text-sm text-[var(--px-danger)]">
            {error}
          </p>
        ) : (
          <p id="plant-help" className="mt-2 text-sm text-[var(--px-ink-soft)]">
            No title or tags needed. It starts as a New Thought.
          </p>
        )}

        <div className="mt-4 flex justify-end gap-3">
          <button type="button" className="px-btn px-btn--ghost" onClick={onClose} disabled={saving}>
            Later
          </button>
          <button type="submit" className="px-btn px-btn--primary" disabled={saving}>
            <PixelIcon name="plant" scale={2} />
            {saving ? "Planting…" : error ? "Try again" : "Plant"}
          </button>
        </div>
      </form>
    </div>
  );
}
