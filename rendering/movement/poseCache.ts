import type { ExplorerState, ViewMode } from "@/rendering/movement/explorerState";

/**
 * Remembers where you stood and which view you used for this browser tab, so
 * leaving for the Notebook or Map and coming back returns you to the same
 * spot (spec 22.3). Per-tab UI state only; it holds no thought data.
 */
const KEY = "thought-orchard:pose";

export interface SavedPose {
  x: number;
  z: number;
  heading: number;
  pitch: number;
  explorerYaw: number;
  explorerDistance: number;
  view: ViewMode;
}

export function savePose(state: ExplorerState, view: ViewMode): void {
  const pose: SavedPose = {
    x: state.x,
    z: state.z,
    heading: state.heading,
    pitch: state.pitch,
    explorerYaw: state.explorerYaw,
    explorerDistance: state.explorerDistance,
    view,
  };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(pose));
  } catch {
    // Storage unavailable: you'll start at the entrance next time.
  }
}

/** The stored pose as a string: stable between calls, for useSyncExternalStore. */
export function loadPoseRaw(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function loadPose(): SavedPose | null {
  return parsePose(loadPoseRaw());
}

export function parsePose(raw: string | null): SavedPose | null {
  try {
    if (!raw) return null;
    const pose = JSON.parse(raw) as SavedPose;
    const numbers = [pose.x, pose.z, pose.heading, pose.pitch, pose.explorerYaw, pose.explorerDistance];
    if (!numbers.every((n) => Number.isFinite(n))) return null;
    if (pose.view !== "immersive" && pose.view !== "explorer") return null;
    return pose;
  } catch {
    return null;
  }
}

export function applyPose(state: ExplorerState, pose: SavedPose): void {
  state.x = pose.x;
  state.z = pose.z;
  state.heading = pose.heading;
  state.pitch = pose.pitch;
  state.explorerYaw = pose.explorerYaw;
  state.explorerDistance = pose.explorerDistance;
}
