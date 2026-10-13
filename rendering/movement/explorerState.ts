import type { Point } from "@/features/world/worldLayout";
import { WORLD_LAYOUT } from "@/features/world/worldLayout";

/**
 * Shared movement state for both views (spec 20.4, P-05). One explorer pose
 * drives the Immersive camera and the Explorer character, so switching views
 * never moves anything in the world. Mutated every frame, so it lives outside
 * React state.
 */

export type ViewMode = "immersive" | "explorer";
export type MovementMode = "walk";

/** Walk speed, metres per second (spec 20.2, 20.6). Wander and Sprint are deferred. */
export const SPEEDS: Record<MovementMode, number> = { walk: 1.4 };
export const EYE_HEIGHT = 1.6;
export const EXPLORER_HEIGHT = 1.6;
/** Immersive look limits (spec 20.2): 35° down to 60° up. */
export const PITCH_MIN = (-35 * Math.PI) / 180;
export const PITCH_MAX = (60 * Math.PI) / 180;
/** Explorer camera limits (spec 20.3). */
export const EXPLORER_DISTANCE = { min: 18, max: 40, initial: 18 };
export const EXPLORER_PITCH = (55 * Math.PI) / 180;

export interface WalkTarget {
  point: Point;
  /** Stop this far from the point (used to stop short of a trunk). */
  stopDistance: number;
  /** Called once on arrival, or when the way is blocked. */
  onArrive?: () => void;
}

export interface ExplorerState {
  x: number;
  z: number;
  /** 0 faces north (−z); positive turns left. Forward is (−sin h, −cos h). */
  heading: number;
  /** Immersive look pitch, radians. */
  pitch: number;
  target: WalkTarget | null;
  /** Heading to turn toward smoothly (to face a tree), or null. */
  faceHeading: number | null;
  mode: MovementMode;
  moving: boolean;
  /** Keys currently held: forward/back/left/right/turnLeft/turnRight. */
  keys: Set<string>;
  explorerYaw: number;
  explorerDistance: number;
  /** Temporary look-around offset in Explorer view; eases back when walking. */
  lookOffset: Point;
}

export function createExplorerState(): ExplorerState {
  const e = WORLD_LAYOUT.entrance;
  return {
    x: e.x,
    z: e.z,
    heading: e.heading,
    pitch: (8 * Math.PI) / 180,
    target: null,
    faceHeading: null,
    mode: "walk",
    moving: false,
    keys: new Set(),
    explorerYaw: 0,
    explorerDistance: EXPLORER_DISTANCE.initial,
    lookOffset: { x: 0, z: 0 },
  };
}

export function forward(heading: number): Point {
  return { x: -Math.sin(heading), z: -Math.cos(heading) };
}

/** Heading that faces from `from` toward `to`. */
export function headingTo(from: Point, to: Point): number {
  return Math.atan2(-(to.x - from.x), -(to.z - from.z));
}

/** Smallest signed difference between two angles. */
export function angleDelta(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function returnToEntrance(state: ExplorerState): void {
  const e = WORLD_LAYOUT.entrance;
  state.x = e.x;
  state.z = e.z;
  state.heading = e.heading;
  state.pitch = (8 * Math.PI) / 180;
  state.target = null;
  state.faceHeading = null;
  state.explorerYaw = 0;
  state.lookOffset = { x: 0, z: 0 };
}
