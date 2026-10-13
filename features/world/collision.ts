import type { Point } from "@/features/world/worldLayout";

/**
 * Movement collision (spec 20.8, P-08). Pure functions so they can be tested
 * without rendering. Trunks are circles; the walkable area is the union of
 * open regions. Movement slides along both instead of stopping dead.
 */

export interface CircleCollider {
  x: number;
  z: number;
  r: number;
}

/** Clearance kept between the viewer or explorer and any trunk. */
export const TRUNK_CLEARANCE = 0.35;
/** How far inside a region's edge the walkable area stops. */
export const BOUNDARY_INSET = 1.5;

function pushOut(p: Point, c: CircleCollider, from: Point): Point {
  const dx = p.x - c.x;
  const dz = p.z - c.z;
  const d = Math.hypot(dx, dz);
  if (d >= c.r) return p;
  if (d < 1e-6) {
    // Exactly at the centre: push back toward where we came from.
    const bx = from.x - c.x;
    const bz = from.z - c.z;
    const bd = Math.hypot(bx, bz) || 1;
    return { x: c.x + (bx / bd) * c.r, z: c.z + (bz / bd) * c.r };
  }
  return { x: c.x + (dx / d) * c.r, z: c.z + (dz / d) * c.r };
}

function keepInside(p: Point, areas: CircleCollider[]): Point {
  if (areas.length === 0) return p;
  let nearest = areas[0];
  let bestSlack = -Infinity;
  for (const a of areas) {
    const slack = a.r - Math.hypot(p.x - a.x, p.z - a.z);
    if (slack >= 0) return p;
    if (slack > bestSlack) {
      bestSlack = slack;
      nearest = a;
    }
  }
  const dx = p.x - nearest.x;
  const dz = p.z - nearest.z;
  const d = Math.hypot(dx, dz) || 1;
  return { x: nearest.x + (dx / d) * nearest.r, z: nearest.z + (dz / d) * nearest.r };
}

/**
 * Moves from `from` toward `to`, then resolves overlaps with trunks and the
 * walkable area. Returns where the mover actually ends up.
 */
export function resolveMove(
  from: Point,
  to: Point,
  trunks: CircleCollider[],
  walkableAreas: CircleCollider[]
): Point {
  let p = { ...to };
  for (let pass = 0; pass < 3; pass++) {
    for (const t of trunks) p = pushOut(p, t, from);
    p = keepInside(p, walkableAreas);
  }
  return p;
}
