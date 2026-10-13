import type { GrowthStage } from "@/types/thought";
import { GROWTH_STAGES } from "@/features/growth/stages";

/**
 * Growth model, version 1 (spec 4.2–4.4; C-24, C-25, C-31).
 *
 * Time and care are separate inputs. Everything is integer milliseconds, so
 * the same planting time, care history and "now" always give the same result.
 */

export const GROWTH_MODEL_VERSION = 1;
export const DAY_MS = 86_400_000;

/** One bonus day per counted watering (C-31). */
export const WATER_BONUS_DAYS = 1;
/** At most one watering counts per window (P-01, proposed). */
export const WATERING_WINDOW_HOURS = 20;
const WATERING_WINDOW_MS = WATERING_WINDOW_HOURS * 3_600_000;

/**
 * Days of growth at which each stage begins. The 60-day total is confirmed
 * (C-31); the intermediate values are proposed (P-01).
 */
export const STAGE_THRESHOLD_DAYS: readonly number[] = [0, 1, 3, 7, 14, 30, 60];

export type CareType = "water" | "sunlight" | "wind";

export interface CareInput {
  _id: string;
  type: CareType;
  createdAt: string | Date;
}

export interface GrowthState {
  modelVersion: number;
  /** Time contribution: elapsed since planting, in ms. */
  timeMs: number;
  /** Care contribution after the cap, in ms. */
  careMs: number;
  /** Care contribution before the cap ("banked" care), in ms. */
  careRawMs: number;
  growthMs: number;
  stage: GrowthStage;
  stageNumber: number;
  /** 0–1 progress through the current stage; 1 at Fully Grown. */
  progress: number;
  countedWaterings: number;
  lastWateredAt: string | null;
}

function toMs(value: string | Date): number {
  return typeof value === "string" ? Date.parse(value) : value.getTime();
}

/**
 * Waterings that count toward growth: the first, then each one at least
 * WATERING_WINDOW_HOURS after the previous counted one. Only events between
 * planting and `now` are considered. Sunlight and wind carry zero weight in
 * this model version (spec 4.4).
 */
export function countedWateringTimes(plantedMs: number, care: CareInput[], nowMs: number): number[] {
  const waterings = care
    .filter((c) => c.type === "water")
    .map((c) => ({ id: c._id, at: toMs(c.createdAt) }))
    .filter((c) => c.at >= plantedMs && c.at <= nowMs)
    .sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const counted: number[] = [];
  for (const w of waterings) {
    if (counted.length === 0 || w.at - counted[counted.length - 1] >= WATERING_WINDOW_MS) {
      counted.push(w.at);
    }
  }
  return counted;
}

export function computeGrowth(
  createdAt: string | Date,
  care: CareInput[],
  now: string | Date | number
): GrowthState {
  const plantedMs = toMs(createdAt);
  const nowMs = typeof now === "number" ? now : toMs(now);

  const timeMs = Math.max(0, nowMs - plantedMs);
  const counted = countedWateringTimes(plantedMs, care, nowMs);
  const careRawMs = counted.length * WATER_BONUS_DAYS * DAY_MS;
  // Care may be at most one third of total growth: care ≤ time / 2.
  const careMs = Math.min(careRawMs, Math.floor(timeMs / 2));
  const growthMs = timeMs + careMs;

  let index = 0;
  for (let i = 0; i < STAGE_THRESHOLD_DAYS.length; i++) {
    if (STAGE_THRESHOLD_DAYS[i] * DAY_MS <= growthMs) index = i;
  }
  const startMs = STAGE_THRESHOLD_DAYS[index] * DAY_MS;
  const nextMs = index + 1 < STAGE_THRESHOLD_DAYS.length ? STAGE_THRESHOLD_DAYS[index + 1] * DAY_MS : null;
  const progress = nextMs === null ? 1 : (growthMs - startMs) / (nextMs - startMs);

  const allWaterings = care
    .filter((c) => c.type === "water")
    .map((c) => toMs(c.createdAt))
    .filter((t) => t <= nowMs);
  const last = allWaterings.length ? Math.max(...allWaterings) : null;

  return {
    modelVersion: GROWTH_MODEL_VERSION,
    timeMs,
    careMs,
    careRawMs,
    growthMs,
    stage: GROWTH_STAGES[index].id,
    stageNumber: index + 1,
    progress,
    countedWaterings: counted.length,
    lastWateredAt: last === null ? null : new Date(last).toISOString(),
  };
}

/**
 * Number of warm light points in a tree's canopy (spec 4.6, P-15). Rises
 * through each stage's range with progress, plus care, capped at the top of
 * the range. An untended tree still has at least the stage minimum.
 */
export const LIGHT_POINT_RANGES: readonly [number, number][] = [
  [1, 1], [0, 1], [1, 2], [2, 4], [4, 8], [8, 14], [12, 20],
];

export function lightPointCount(growth: Pick<GrowthState, "stageNumber" | "progress" | "countedWaterings">): number {
  const [min, max] = LIGHT_POINT_RANGES[growth.stageNumber - 1];
  const span = max - min;
  const fromProgress = Math.floor(span * 0.5 * growth.progress);
  const fromCare = Math.min(growth.countedWaterings, Math.ceil(span / 2));
  return Math.min(max, min + fromProgress + fromCare);
}
