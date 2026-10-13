import type { GrowthStage } from "@/types/thought";
import { GROWTH_STAGES } from "@/features/growth/stages";

/**
 * Growth model, version 2 (spec 4.2–4.7; decisions of 2026-10-13).
 *
 * A tree's state is replayed from its planting time and its care history, so
 * the same history and the same "now" always give the same result, and a tree
 * that faded while you were away looks right the moment you come back.
 *
 * - Healthy trees grow with time. Each counted watering adds a bonus day,
 *   but care can be at most a third of growth (bonus ≤ healthy time / 2).
 * - About a week without water and the tree **weakens**: it stops growing.
 * - Watering a weakened tree **revives** it, but it drops one stage.
 * - About a month without water and the tree **dies**. The dead tree stays in
 *   its place and the thought stays readable; nothing is deleted.
 * - **Fully Grown** needs 60 days of growth *and* waterings on 30 separate
 *   days. A Fully Grown tree is rooted and never fades.
 * - Sunlight and wind don't change growth or fading; they change how the
 *   tree looks.
 *
 * Everything is integer milliseconds.
 */

export const GROWTH_MODEL_VERSION = 2;
export const DAY_MS = 86_400_000;

/** One bonus day per counted watering. */
export const WATER_BONUS_DAYS = 1;
/** At most one watering counts per window, so "a watering" means "a day you watered". */
export const WATERING_WINDOW_HOURS = 20;
const WATERING_WINDOW_MS = WATERING_WINDOW_HOURS * 3_600_000;

/** Days of growth at which each stage begins. */
export const STAGE_THRESHOLD_DAYS: readonly number[] = [0, 1, 3, 7, 14, 30, 60];

/** Days without water before a tree weakens, and before it dies. */
export const WEAKEN_AFTER_DAYS = 7;
export const DIE_AFTER_DAYS = 30;
/** Separate watering days a tree needs before it can be Fully Grown. */
export const ROOTING_WATERING_DAYS = 30;

/** Sunlight or wind days needed for each visible level (1–3). */
export const CARE_LEVEL_DAYS: readonly number[] = [1, 4, 10];

export type CareType = "water" | "sunlight" | "wind";
export const CARE_TYPES: readonly CareType[] = ["water", "sunlight", "wind"];

export type TreeHealth = "healthy" | "weak" | "dead";

export interface CareInput {
  _id: string;
  type: CareType;
  createdAt: string | Date;
}

export interface GrowthState {
  modelVersion: number;
  health: TreeHealth;
  /** Fully Grown and rooted: it no longer fades. */
  rooted: boolean;
  growthMs: number;
  stage: GrowthStage;
  stageNumber: number;
  /** 0–1 progress through the current stage; 1 at Fully Grown. */
  progress: number;
  /** Separate days the tree was watered (counted waterings). */
  countedWaterings: number;
  /** How many times it lost a stage by being revived. */
  stagesLost: number;
  lastWateredAt: string | null;
  /** When it weakens or weakened (null once rooted or dead before weakening can matter). */
  weakensAt: string | null;
  /** When it dies or died (null once rooted). */
  diesAt: string | null;
  /** Whole days left before it weakens, while it is healthy and not rooted; otherwise null. */
  daysUntilWeak: number | null;
  /** Separate days of sunlight and wind, and the visible level (0–3) each gives. */
  sunlightDays: number;
  windDays: number;
  sunlightLevel: number;
  windLevel: number;
}

function toMs(value: string | Date): number {
  return typeof value === "string" ? Date.parse(value) : value.getTime();
}

/**
 * Care of one type that counts: the first, then each one at least
 * WATERING_WINDOW_HOURS after the previous counted one, between planting and
 * `now`. Ties are broken by id so the result never depends on input order.
 */
export function countedCareTimes(type: CareType, plantedMs: number, care: CareInput[], nowMs: number): number[] {
  const events = care
    .filter((c) => c.type === type)
    .map((c) => ({ id: c._id, at: toMs(c.createdAt) }))
    .filter((c) => c.at >= plantedMs && c.at <= nowMs)
    .sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const counted: number[] = [];
  for (const e of events) {
    if (counted.length === 0 || e.at - counted[counted.length - 1] >= WATERING_WINDOW_MS) counted.push(e.at);
  }
  return counted;
}

export function countedWateringTimes(plantedMs: number, care: CareInput[], nowMs: number): number[] {
  return countedCareTimes("water", plantedMs, care, nowMs);
}

function stageIndexFor(growthMs: number): number {
  let index = 0;
  for (let i = 0; i < STAGE_THRESHOLD_DAYS.length; i++) {
    if (STAGE_THRESHOLD_DAYS[i] * DAY_MS <= growthMs) index = i;
  }
  return index;
}

export function careLevel(days: number): number {
  return CARE_LEVEL_DAYS.filter((d) => days >= d).length;
}

const FULL_MS = STAGE_THRESHOLD_DAYS[STAGE_THRESHOLD_DAYS.length - 1] * DAY_MS;
/** The most a tree can grow before it has been watered on enough days: just short of Fully Grown. */
const UNROOTED_CAP_MS = FULL_MS - 1;

export function computeGrowth(createdAt: string | Date, care: CareInput[], now: string | Date | number): GrowthState {
  const plantedMs = toMs(createdAt);
  const nowMs = Math.max(plantedMs, typeof now === "number" ? now : toMs(now));
  const waterings = countedWateringTimes(plantedMs, care, nowMs);

  // Replay state.
  let growthMs = 0;
  let healthyMs = 0; // time spent healthy, the basis of the care cap
  let appliedBonusMs = 0;
  let bankedBonusMs = 0;
  let counted = 0;
  let stagesLost = 0;
  let rooted = false;
  let dead = false;
  let lastWaterMs = plantedMs;

  const cap = () => (counted >= ROOTING_WATERING_DAYS ? FULL_MS : UNROOTED_CAP_MS);

  /** Grow while healthy from `from` to `to` (ms), applying banked care within the cap. */
  const growHealthy = (from: number, to: number) => {
    if (to <= from) return;
    const dt = to - from;
    healthyMs += dt;
    growthMs += dt;
    const allowed = Math.floor(healthyMs / 2) - appliedBonusMs;
    const apply = Math.max(0, Math.min(bankedBonusMs, allowed));
    appliedBonusMs += apply;
    bankedBonusMs -= apply;
    growthMs += apply;
    growthMs = Math.min(growthMs, cap());
    if (growthMs >= FULL_MS && counted >= ROOTING_WATERING_DAYS) rooted = true;
  };

  /** Advance from the last watering to `to`, through weakening and death. Returns true if still alive. */
  const advance = (to: number) => {
    if (rooted) {
      growHealthy(lastWaterMs, to);
      return;
    }
    const weakenMs = lastWaterMs + WEAKEN_AFTER_DAYS * DAY_MS;
    growHealthy(lastWaterMs, Math.min(to, weakenMs));
    if (!rooted && to >= lastWaterMs + DIE_AFTER_DAYS * DAY_MS) dead = true;
  };

  let cursor = plantedMs;
  for (const at of waterings) {
    // Grow (or fade) up to this watering, from wherever the last segment ended.
    lastWaterMs = cursor;
    advance(at);
    if (dead) break;
    const wasWeak = !rooted && at >= cursor + WEAKEN_AFTER_DAYS * DAY_MS;
    counted += 1;
    if (wasWeak) {
      // Revived: drop one stage and start growing again from its beginning.
      const index = stageIndexFor(growthMs);
      growthMs = STAGE_THRESHOLD_DAYS[Math.max(0, index - 1)] * DAY_MS;
      stagesLost += 1;
    } else {
      bankedBonusMs += WATER_BONUS_DAYS * DAY_MS;
    }
    if (growthMs >= FULL_MS && counted >= ROOTING_WATERING_DAYS) rooted = true;
    cursor = at;
  }
  if (!dead) {
    lastWaterMs = cursor;
    advance(nowMs);
  }

  const weak = !dead && !rooted && nowMs >= lastWaterMs + WEAKEN_AFTER_DAYS * DAY_MS;
  const health: TreeHealth = dead ? "dead" : weak ? "weak" : "healthy";

  const index = stageIndexFor(growthMs);
  const startMs = STAGE_THRESHOLD_DAYS[index] * DAY_MS;
  const nextMs = index + 1 < STAGE_THRESHOLD_DAYS.length ? STAGE_THRESHOLD_DAYS[index + 1] * DAY_MS : null;
  const progress = nextMs === null ? 1 : Math.min(1, (growthMs - startMs) / (nextMs - startMs));

  const allWaterings = care
    .filter((c) => c.type === "water")
    .map((c) => toMs(c.createdAt))
    .filter((t) => t >= plantedMs && t <= nowMs);
  const last = allWaterings.length ? Math.max(...allWaterings) : null;

  const sunlightDays = countedCareTimes("sunlight", plantedMs, care, nowMs).length;
  const windDays = countedCareTimes("wind", plantedMs, care, nowMs).length;

  return {
    modelVersion: GROWTH_MODEL_VERSION,
    health,
    rooted,
    growthMs,
    stage: GROWTH_STAGES[index].id,
    stageNumber: index + 1,
    progress,
    countedWaterings: counted,
    stagesLost,
    lastWateredAt: last === null ? null : new Date(last).toISOString(),
    weakensAt: rooted ? null : new Date(lastWaterMs + WEAKEN_AFTER_DAYS * DAY_MS).toISOString(),
    diesAt: rooted ? null : new Date(lastWaterMs + DIE_AFTER_DAYS * DAY_MS).toISOString(),
    daysUntilWeak:
      health === "healthy" && !rooted ? Math.ceil((lastWaterMs + WEAKEN_AFTER_DAYS * DAY_MS - nowMs) / DAY_MS) : null,
    sunlightDays,
    windDays,
    sunlightLevel: careLevel(sunlightDays),
    windLevel: careLevel(windDays),
  };
}

/**
 * Number of warm light points in a tree's canopy (spec 4.6). Rises through
 * each stage's range with progress and watering; sunlight adds a few more.
 * A weakened tree's lights dim to half; a dead tree has none.
 */
export const LIGHT_POINT_RANGES: readonly [number, number][] = [
  [1, 1], [0, 1], [1, 2], [2, 4], [4, 8], [8, 14], [12, 20],
];

export function lightPointCount(
  growth: Pick<GrowthState, "stageNumber" | "progress" | "countedWaterings"> & Partial<Pick<GrowthState, "health" | "sunlightLevel">>
): number {
  if (growth.health === "dead") return 0;
  const [min, max] = LIGHT_POINT_RANGES[growth.stageNumber - 1];
  const span = max - min;
  const fromProgress = Math.floor(span * 0.5 * growth.progress);
  const fromCare = Math.min(growth.countedWaterings, Math.ceil(span / 2));
  const sun = growth.stageNumber >= 3 ? (growth.sunlightLevel ?? 0) : 0;
  const count = Math.min(max + sun, min + fromProgress + fromCare + sun);
  return growth.health === "weak" ? Math.floor(count / 2) : count;
}
