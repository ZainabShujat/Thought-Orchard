import { ThoughtPosition } from "@/types/thought";
import { createRng, hashString } from "@/lib/random";
import { WORLD_LAYOUT, WorldLayout, isOnPath, regionAt } from "@/features/world/worldLayout";

export interface PlacementOptions {
  minDistance?: number;
  /** Extra clearance between a trunk and the edge of a path. */
  pathClearance?: number;
  seed?: number;
  layout?: WorldLayout;
}

export interface Placement {
  position: ThoughtPosition;
  regionId: string;
  /** Planting site used, or "overflow" when every site is full. */
  siteId: string;
}

const DEFAULTS = { minDistance: 4.8, pathClearance: 1.6, seed: 42 };
const ATTEMPTS_PER_SITE = 48;
const GRID_STEP = 0.25;
/** Sites smaller than this hold one tree at their exact centre. */
const POINT_SITE_RADIUS = 1.5;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Landscape-aware placement (spec 20.7, P-17; ADR-004).
 *
 * Regions are tried in layout order and, inside each, planting sites in
 * order, so trees gather in groves along the paths instead of filling any
 * free space. Inside a site, seeded candidates are tested against the
 * region boundary, the paths, and minimum spacing. Existing positions are
 * never changed, and the same inputs always give the same answer.
 */
export function findNextTreePosition(existing: ThoughtPosition[], options: PlacementOptions = {}): Placement {
  const minDistance = options.minDistance ?? DEFAULTS.minDistance;
  const pathClearance = options.pathClearance ?? DEFAULTS.pathClearance;
  const seed = options.seed ?? DEFAULTS.seed;
  const layout = options.layout ?? WORLD_LAYOUT;

  const spaced = (x: number, z: number) =>
    existing.every((p) => Math.hypot(p.x - x, p.z - z) >= minDistance);

  for (const region of layout.regions) {
    const insideRegion = (x: number, z: number) =>
      Math.hypot(x - region.center.x, z - region.center.z) <= region.radius - 1;

    for (const site of region.sites) {
      const occupied = existing.filter(
        (p) => Math.hypot(p.x - site.center.x, p.z - site.center.z) <= site.radius + 0.01
      ).length;
      if (occupied >= site.capacity) continue;

      if (site.radius < POINT_SITE_RADIUS) {
        const { x, z } = site.center;
        if (spaced(x, z) && !isOnPath(x, z, pathClearance, layout)) {
          return { position: { x, z }, regionId: region.id, siteId: site.id };
        }
        continue;
      }

      const fits = (x: number, z: number) =>
        insideRegion(x, z) && !isOnPath(x, z, pathClearance, layout) && spaced(x, z);

      // Seeded random candidates give a natural, varied layout...
      const rng = createRng((seed ^ hashString(site.id)) + existing.length * 17);
      for (let attempt = 0; attempt < ATTEMPTS_PER_SITE; attempt++) {
        const r = site.radius * Math.sqrt(rng());
        const a = rng() * Math.PI * 2;
        const x = round2(site.center.x + Math.cos(a) * r);
        const z = round2(site.center.z + Math.sin(a) * r);
        if (fits(x, z)) return { position: { x, z }, regionId: region.id, siteId: site.id };
      }
      // ...and a fine grid scan proves a site is really full before moving on,
      // so sites always fill in order.
      for (let gz = -site.radius; gz <= site.radius; gz += GRID_STEP) {
        for (let gx = -site.radius; gx <= site.radius; gx += GRID_STEP) {
          if (gx * gx + gz * gz > site.radius * site.radius) continue;
          const x = round2(site.center.x + gx);
          const z = round2(site.center.z + gz);
          if (fits(x, z)) return { position: { x, z }, regionId: region.id, siteId: site.id };
        }
      }
    }
  }

  // Every site in every region is full. Keep spacing rather than overlap;
  // a future layout version should add regions before this is reached.
  const outer = Math.max(...layout.regions.map((r) => Math.hypot(r.center.x, r.center.z) + r.radius));
  for (let ring = 1; ; ring++) {
    const radius = outer + ring * minDistance;
    for (let i = 0; i < 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      const x = round2(Math.cos(angle) * radius);
      const z = round2(Math.sin(angle) * radius);
      if (spaced(x, z)) return { position: { x, z }, regionId: regionAt(x, z, layout)?.id ?? "overflow", siteId: "overflow" };
    }
  }
}

/**
 * Gives every item a position and region, keeping any position it already
 * has. Used for seeded sample data; real thoughts are placed by the server.
 */
export function ensureThoughtPositions<T extends object>(
  items: T[],
  options?: PlacementOptions
): (T & { position: ThoughtPosition; regionId: string })[] {
  const allocated: ThoughtPosition[] = [];
  const layout = options?.layout ?? WORLD_LAYOUT;

  return items.map((item) => {
    const existing = (item as { position?: ThoughtPosition }).position;
    const placed = existing
      ? { position: existing, regionId: regionAt(existing.x, existing.z, layout)?.id ?? "overflow" }
      : findNextTreePosition(allocated, options);
    allocated.push(placed.position);
    return { ...item, position: placed.position, regionId: placed.regionId };
  });
}
