/**
 * Project palette (spec 18.4). The 3D world and the UI share these colours;
 * `app/globals.css` mirrors the UI subset as CSS custom properties.
 * Final values are still open (OD-02).
 */
export const PALETTE = {
  // Sky and atmosphere
  skyTop: "#8fcfe8",
  skyHaze: "#cbe7e3",

  // Grass and foliage, deep to sunlit
  leafDeep: "#24543a",
  leafDark: "#2f6b3a",
  leafMid: "#4b8f3e",
  leafLight: "#79b347",
  leafSun: "#a8d15a",

  // Earth and paths
  soilDark: "#5c3a24",
  soil: "#7a5233",
  dirt: "#b08452",
  dirtLight: "#c9a06a",

  // Wood
  barkDark: "#3f2a1c",
  bark: "#5e3f28",
  barkLight: "#7d5636",

  // Accents
  blossomPink: "#f4a6b8",
  blossomWhite: "#f6eedd",
  blossomPeach: "#f2b38a",
  fruitAmber: "#f2c14e",
  water: "#4aa3df",
  amber: "#f2c14e",
  amberDeep: "#d9902f",
  flowerYellow: "#f5d76e",
  flowerViolet: "#a98bd6",
  stone: "#8d8a7a",
} as const;

export type PaletteColor = (typeof PALETTE)[keyof typeof PALETTE];
