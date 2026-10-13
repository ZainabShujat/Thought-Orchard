"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Thought } from "@/types/thought";
import { CareType, GrowthState, computeGrowth } from "@/features/growth/growthModel";
import * as api from "@/lib/orchardApi";
import type { CareStatus } from "@/components/thoughts/ThoughtActions";

/**
 * The signed-in user's thoughts, shared by the Orchard, Notebook and Map
 * pages. The server is the source of truth; growth is recomputed locally with
 * the server's clock offset so a long visit stays current (spec 4.4).
 */

export type LoadState = { state: "loading" } | { state: "ready" } | { state: "error"; message: string };

export interface ThoughtEntry {
  thought: Thought;
  growth: GrowthState;
}

const GROWTH_TICK_MS = 60_000;

export interface CareOutcome {
  type: CareType;
  counted: boolean;
  revived: boolean;
}

const VERB: Record<CareType, string> = { water: "watering", sunlight: "sunlight", wind: "wind" };

export function useThoughts() {
  const [load, setLoad] = useState<LoadState>({ state: "loading" });
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [careState, setCareState] = useState<Record<string, CareStatus>>({});
  const careKeys = useRef<Record<string, string>>({});
  const plantKey = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    setLoad({ state: "loading" });
    try {
      const { thoughts: list, serverNow } = await api.listThoughts();
      setThoughts(list);
      setServerOffsetMs(Date.parse(serverNow) - Date.now());
      setNow(Date.now());
      setLoad({ state: "ready" });
    } catch (err) {
      setLoad({ state: "error", message: err instanceof Error ? err.message : "Couldn't reach your orchard." });
    }
  }, []);

  useEffect(() => {
    // Load once on mount; `refresh` sets state only after the fetch resolves.
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), GROWTH_TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const entries: ThoughtEntry[] = useMemo(
    () => thoughts.map((t) => ({ thought: t, growth: computeGrowth(t.createdAt, t.care, now + serverOffsetMs) })),
    [thoughts, now, serverOffsetMs]
  );

  /** Plants a thought. Retries of the same draft reuse one request key, so it can't plant twice. */
  const plant = useCallback(async (content: string): Promise<Thought> => {
    plantKey.current ??= api.newRequestKey();
    const thought = await api.plantThought(content, plantKey.current);
    plantKey.current = null;
    setThoughts((prev) => (prev.some((t) => t._id === thought._id) ? prev : [...prev, thought]));
    return thought;
  }, []);

  /**
   * Gives a thought water, sunlight or wind. A retry after a failure reuses
   * the same key, so it is never counted twice.
   */
  const careFor = useCallback(async (id: string, type: CareType): Promise<CareOutcome | null> => {
    const slot = `${id}:${type}`;
    const key = (careKeys.current[slot] ??= api.newRequestKey());
    setCareState((s) => ({ ...s, [id]: { state: "pending", type } }));
    try {
      const result = await api.careForThought(id, type, key);
      delete careKeys.current[slot];
      setThoughts((prev) =>
        prev.map((t) =>
          t._id === id && !t.care.some((c) => c._id === result.event._id)
            ? { ...t, care: [...t.care, { _id: result.event._id, type, createdAt: result.event.createdAt }] }
            : t
        )
      );
      setServerOffsetMs(Date.parse(result.serverNow) - Date.now());
      setNow(Date.now());
      setCareState((s) => ({ ...s, [id]: { state: "idle" } }));
      return { type, counted: result.counted, revived: result.revived };
    } catch (err) {
      const reason = err instanceof Error ? ` ${err.message}` : "";
      setCareState((s) => ({ ...s, [id]: { state: "failed", type, message: `The ${VERB[type]} couldn't be saved.${reason}` } }));
      return null;
    }
  }, []);

  const edit = useCallback(async (id: string, content: string) => {
    const updated = await api.editThought(id, content);
    setThoughts((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.deleteThought(id);
    setThoughts((prev) => prev.filter((t) => t._id !== id));
  }, []);

  const careStatus = useCallback((id: string): CareStatus => careState[id] ?? { state: "idle" }, [careState]);

  return { load, refresh, thoughts, entries, serverOffsetMs, plant, careFor, careStatus, edit, remove };
}
