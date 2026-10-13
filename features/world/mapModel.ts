import { GrowthStage } from "@/types/thought";
import { WORLD_LAYOUT, WorldLayout, Point, openRegionIds } from "@/features/world/worldLayout";

/**
 * Map model (spec 20.5, P-06). Everything the future map screen draws comes
 * from here, built from the same world layout and stored tree positions the
 * 3D world uses. The map never invents or stores positions of its own.
 */

export interface MapTreeMarker {
  id: string;
  position: Point;
  regionId: string;
  stage: GrowthStage;
}

export interface MapModel {
  layoutVersion: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  regions: { id: string; name: string | null; center: Point; radius: number; open: boolean }[];
  sites: { id: string; regionId: string; center: Point; radius: number }[];
  paths: { id: string; points: Point[]; halfWidth: number }[];
  trees: MapTreeMarker[];
  explorer: (Point & { heading: number }) | null;
}

export function buildMapModel(
  thoughts: { _id: string; position: Point; regionId: string; stage: GrowthStage }[],
  explorer: (Point & { heading: number }) | null = null,
  layout: WorldLayout = WORLD_LAYOUT
): MapModel {
  const open = new Set(openRegionIds(thoughts, layout));
  const bounds = layout.regions.reduce(
    (b, r) => ({
      minX: Math.min(b.minX, r.center.x - r.radius),
      maxX: Math.max(b.maxX, r.center.x + r.radius),
      minZ: Math.min(b.minZ, r.center.z - r.radius),
      maxZ: Math.max(b.maxZ, r.center.z + r.radius),
    }),
    { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity }
  );

  return {
    layoutVersion: layout.version,
    bounds,
    regions: layout.regions.map((r) => ({
      id: r.id,
      name: r.name,
      center: r.center,
      radius: r.radius,
      open: open.has(r.id),
    })),
    sites: layout.regions.flatMap((r) =>
      r.sites.map((s) => ({ id: s.id, regionId: r.id, center: s.center, radius: s.radius }))
    ),
    paths: layout.paths.map((p) => ({ id: p.id, points: p.points, halfWidth: p.halfWidth })),
    trees: thoughts.map((t) => ({ id: t._id, position: t.position, regionId: t.regionId, stage: t.stage })),
    explorer,
  };
}
