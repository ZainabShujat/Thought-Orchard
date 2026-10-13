import type { ViewMode } from "@/rendering/movement/explorerState";

/**
 * Per-account preferences (spec 7.3, 18.7, 22). Stored in the user's profile
 * in MongoDB; the browser only caches them.
 */
export interface Preferences {
  /** Plain system font instead of the pixel font (spec 18.7). */
  plainFont: boolean;
  /** "system" follows the device setting; "reduce" always reduces motion; "full" never does. */
  motion: "system" | "reduce" | "full";
  /** Which view the orchard opens in. */
  startView: ViewMode;
}

export const DEFAULT_PREFERENCES: Preferences = {
  plainFont: false,
  motion: "system",
  startView: "immersive",
};

export interface Profile {
  displayName: string;
  email: string;
  onboarded: boolean;
  preferences: Preferences;
  createdAt: string;
}
