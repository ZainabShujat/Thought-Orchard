/**
 * Atmosphere presets (spec 18.9, 21). Lighting, sky, fog and fireflies all
 * read from one preset chosen by `timeOfDay`. Milestone 1 has a single fixed
 * time, golden late afternoon; adding time of day later adds presets and
 * changes the input, not the scene code.
 */
export type TimeOfDay = "golden-afternoon";

export interface AtmospherePreset {
  /** Sky bands from the horizon up; drawn as hard bands, not a smooth gradient. */
  skyBands: string[];
  fog: { color: string; near: number; far: number };
  sun: { color: string; intensity: number; position: [number, number, number] };
  hemisphere: { sky: string; ground: string; intensity: number };
  fireflies: { count: number; color: string };
  motes: { count: number; color: string };
  /** Warm points in thought-tree canopies (18.9). */
  treeLight: { color: string; nearColor: string };
}

export const ATMOSPHERES: Record<TimeOfDay, AtmospherePreset> = {
  "golden-afternoon": {
    skyBands: ["#f1dca2", "#e3dfb0", "#cddcb8", "#b5d2bd", "#9fc4bf"],
    fog: { color: "#d8d8a8", near: 16, far: 72 },
    // Low sun from behind the viewer's left as they walk in from the entrance.
    sun: { color: "#ffd890", intensity: 2.1, position: [-30, 18, 34] },
    hemisphere: { sky: "#fff0c8", ground: "#2c4a2a", intensity: 0.95 },
    fireflies: { count: 140, color: "#ffd25e" },
    motes: { count: 90, color: "#fff4d0" },
    treeLight: { color: "#ffd56a", nearColor: "#fff2b8" },
  },
};
