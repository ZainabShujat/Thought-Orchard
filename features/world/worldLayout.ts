/**
 * The world layout: regions, planting sites and paths (spec 20.5, 20.7).
 *
 * This is the single source of truth for the orchard's geography. Placement
 * (domain), the 3D ground (rendering), movement bounds and the map model all
 * read it, so the map can never drift from the world. One world unit is one
 * metre. Changing this layout bumps `version` (stored on the orchard as
 * `placementVersion`); existing trees keep their stored positions regardless.
 */

export interface Point {
  x: number;
  z: number;
}

/** A grove or clearing where thought-trees may be planted (spec 20.7, P-17). */
export interface PlantingSite {
  id: string;
  center: Point;
  radius: number;
  capacity: number;
}

export interface Region {
  id: string;
  /** Display name; null until region names are decided (OD-19). */
  name: string | null;
  center: Point;
  radius: number;
  /** Filled in this order; trees cluster in one site before the next opens. */
  sites: PlantingSite[];
}

export interface WorldPath {
  id: string;
  points: Point[];
  halfWidth: number;
}

export interface WorldLayout {
  version: number;
  /** Planting order: the first region is open from the start. */
  regions: Region[];
  paths: WorldPath[];
  /** Where the explorer starts and "Back to the path" returns to. */
  entrance: Point & { heading: number };
}

function ring(center: Point, radius: number, count: number, startDeg = 0): Point[] {
  return Array.from({ length: count + 1 }, (_, i) => {
    const a = ((startDeg + (i * 360) / count) * Math.PI) / 180;
    return { x: center.x + Math.cos(a) * radius, z: center.z + Math.sin(a) * radius };
  });
}

function polar(deg: number, radius: number, origin: Point = { x: 0, z: 0 }): Point {
  const a = (deg * Math.PI) / 180;
  return { x: origin.x + Math.cos(a) * radius, z: origin.z + Math.sin(a) * radius };
}

function site(id: string, center: Point, radius: number, capacity: number): PlantingSite {
  return { id, center, radius, capacity };
}

/** Reserved regions get a central clearing plus a ring of groves. */
function reservedSites(prefix: string, center: Point): PlantingSite[] {
  return [
    site(`${prefix}-heart`, center, 3.5, 3),
    ...[0, 72, 144, 216, 288].map((deg, i) => site(`${prefix}-grove-${i + 1}`, polar(deg + 20, 9, center), 3.5, 3)),
  ];
}

const GROVE_LOOP_RADIUS = 11;

export const WORLD_LAYOUT: WorldLayout = {
  version: 1,
  regions: [
    {
      // The central grove: open from the start.
      id: "grove",
      name: null,
      center: { x: 0, z: 0 },
      radius: 24,
      sites: [
        site("grove-heart", { x: 0, z: 0 }, 1.2, 1),
        // Small groves inside the path loop.
        ...[-90, -15, 195, 40, 140].map((deg, i) => site(`grove-inner-${i + 1}`, polar(deg, 5.6), 2.8, 2)),
        // Larger groves outside the loop, between the forks.
        ...[-60, 50, 130, 215, 250, 5].map((deg, i) => site(`grove-outer-${i + 1}`, polar(deg, 17.5), 4, 3)),
      ],
    },
    // Reserved regions: forest until they open, in this order (spec 20.7).
    { id: "north", name: null, center: { x: 0, z: -52 }, radius: 16, sites: reservedSites("north", { x: 0, z: -52 }) },
    { id: "east", name: null, center: { x: 50, z: -18 }, radius: 16, sites: reservedSites("east", { x: 50, z: -18 }) },
    { id: "west", name: null, center: { x: -52, z: 4 }, radius: 16, sites: reservedSites("west", { x: -52, z: 4 }) },
  ],
  paths: [
    { id: "grove-loop", points: ring({ x: 0, z: 0 }, GROVE_LOOP_RADIUS, 24), halfWidth: 0.9 },
    {
      id: "entry",
      points: [
        { x: 0, z: 11 }, { x: 1.4, z: 15 }, { x: -0.6, z: 19 }, { x: 1.2, z: 23 },
        { x: 0.2, z: 28 }, { x: -1.5, z: 34 }, { x: 1, z: 42 }, { x: 0, z: 58 },
      ],
      halfWidth: 1.0,
    },
    { id: "heart-spur", points: [{ x: 0, z: 11 }, { x: 0.4, z: 7 }, { x: 0, z: 3 }], halfWidth: 0.6 },
    {
      id: "north-fork",
      points: [{ x: 0, z: -11 }, { x: -1.5, z: -17 }, { x: 1, z: -24 }, { x: -0.5, z: -31 }, { x: 0, z: -40 }],
      halfWidth: 0.8,
    },
    {
      id: "east-fork",
      points: [{ x: 9.8, z: -5 }, { x: 16, z: -8 }, { x: 24, z: -11 }, { x: 31, z: -14 }, { x: 37, z: -16 }],
      halfWidth: 0.8,
    },
    {
      id: "west-fork",
      points: [{ x: -10.8, z: 2.5 }, { x: -17, z: 4 }, { x: -25, z: 2 }, { x: -32, z: 4 }, { x: -39, z: 3.5 }],
      halfWidth: 0.8,
    },
  ],
  entrance: { x: 0.8, z: 21, heading: 0 },
};

/** Forest-edge trees stand in this band around open regions. */
export const FOREST_EDGE = { margin: 2, extent: 64 } as const;

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const len2 = abx * abx + abz * abz;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.z - a.z) * abz) / len2));
  return Math.hypot(p.x - (a.x + abx * t), p.z - (a.z + abz * t));
}

/** Nearest path centre-line to (x, z): its distance and half-width. */
export function nearestPath(
  x: number,
  z: number,
  layout: WorldLayout = WORLD_LAYOUT
): { distance: number; halfWidth: number } {
  let best = { distance: Infinity, halfWidth: 0 };
  const p = { x, z };
  for (const path of layout.paths) {
    for (let i = 0; i < path.points.length - 1; i++) {
      const d = distanceToSegment(p, path.points[i], path.points[i + 1]);
      if (d < best.distance) best = { distance: d, halfWidth: path.halfWidth };
    }
  }
  return best;
}

/** True when (x, z) is on a path, or within `margin` of its edge. */
export function isOnPath(x: number, z: number, margin = 0, layout: WorldLayout = WORLD_LAYOUT): boolean {
  const { distance, halfWidth } = nearestPath(x, z, layout);
  return distance < halfWidth + margin;
}

export function regionAt(x: number, z: number, layout: WorldLayout = WORLD_LAYOUT): Region | null {
  return layout.regions.find((r) => Math.hypot(x - r.center.x, z - r.center.z) <= r.radius) ?? null;
}

/**
 * Regions currently open: the first region always, plus any region that
 * already has a tree in it. A region opens when placement first uses it.
 */
export function openRegionIds(
  thoughts: { regionId: string }[],
  layout: WorldLayout = WORLD_LAYOUT
): string[] {
  const used = new Set(thoughts.map((t) => t.regionId));
  return layout.regions.filter((r, i) => i === 0 || used.has(r.id)).map((r) => r.id);
}
