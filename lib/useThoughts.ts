"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Thought } from "@/types/thought";
import { GrowthState, computeGrowth } from "@/features/growth/growthModel";
import * as api from "@/lib/orchardApi";
import type { WaterStatus } from "@/components/thoughts/ThoughtActions";

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

export interface WaterOutcome {
  counted: boolean;
}

export function useThoughts() {
  const [load, setLoad] = useState<LoadState>({ state: "loading" });
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [water, setWater] = useState<Record<string, WaterStatus>>({});
  const waterKeys = useRef<Record<string, string>>({});
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

  /** Waters a thought. A retry after a failure reuses the same key, so it is never counted twice. */
  const waterThought = useCallback(async (id: string): Promise<WaterOutcome | null> => {
    const key = (waterKeys.current[id] ??= api.newRequestKey());
    setWater((w) => ({ ...w, [id]: { state: "pending" } }));
    try {
      const result = await api.waterThought(id, key);
      delete waterKeys.current[id];
      setThoughts((prev) =>
        prev.map((t) =>
          t._id === id && !t.care.some((c) => c._id === result.event._id)
            ? { ...t, care: [...t.care, { _id: result.event._id, type: "water", createdAt: result.event.createdAt }] }
            : t
        )
      );
      setServerOffsetMs(Date.parse(result.serverNow) - Date.now());
      setNow(Date.now());
      setWater((w) => ({ ...w, [id]: { state: "idle" } }));
      return { counted: result.counted };
    } catch (err) {
      const reason = err instanceof Error ? ` ${err.message}` : "";
      setWater((w) => ({ ...w, [id]: { state: "failed", message: `The watering couldn't be saved.${reason}` } }));
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

  const waterStatus = useCallback((id: string): WaterStatus => water[id] ?? { state: "idle" }, [water]);

  return { load, refresh, thoughts, entries, serverOffsetMs, plant, waterThought, waterStatus, edit, remove };
}
