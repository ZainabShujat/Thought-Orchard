/**
 * Terrain height in metres. Gentle by design (spec 20.8): the grove's heart
 * stays nearly flat, rolls start further out, and the land lifts slightly at
 * the far edge of the world to frame it.
 */
export function getTerrainHeight(x: number, z: number): number {
  const d = Math.hypot(x, z);
  const rollIn = Math.min(1, Math.max(0, (d - 8) / 14));
  const wave1 = Math.sin(x * 0.12) * Math.cos(z * 0.12) * 0.45;
  const wave2 = Math.sin(x * 0.05 + 1.2) * Math.cos(z * 0.06) * 0.8;
  const rim = Math.max(0, d - 66) * 0.25;
  return (wave1 + wave2) * rollIn + rim;
}
