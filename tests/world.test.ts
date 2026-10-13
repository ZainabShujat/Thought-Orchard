import { describe, expect, it } from "vitest";
import { findNextTreePosition, Placement } from "@/features/placement/placementService";
import { buildMapModel } from "@/features/world/mapModel";
import { CircleCollider, TRUNK_CLEARANCE, resolveMove } from "@/features/world/collision";
import { WORLD_LAYOUT } from "@/features/world/worldLayout";
import { createRng } from "@/lib/random";

function plant(count: number): Placement[] {
  const placed: Placement[] = [];
  for (let i = 0; i < count; i++) placed.push(findNextTreePosition(placed.map((p) => p.position)));
  return placed;
}

describe("buildMapModel (spec 20.5)", () => {
  const placed = plant(15);
  const thoughts = placed.map((p, i) => ({
    _id: `t${i}`,
    position: p.position,
    regionId: p.regionId,
    stage: "young-tree" as const,
  }));
  const map = buildMapModel(thoughts, { x: 1, z: 2, heading: 0 });

  it("has one marker per thought at exactly its stored position", () => {
    expect(map.trees).toHaveLength(thoughts.length);
    map.trees.forEach((m, i) => {
      expect(m.position).toEqual(thoughts[i].position);
      expect(m.regionId).toBe(thoughts[i].regionId);
    });
  });

  it("draws regions, sites and paths straight from the world layout", () => {
    expect(map.regions.map((r) => r.id)).toEqual(WORLD_LAYOUT.regions.map((r) => r.id));
    expect(map.paths.map((p) => p.points)).toEqual(WORLD_LAYOUT.paths.map((p) => p.points));
    expect(map.sites).toHaveLength(WORLD_LAYOUT.regions.reduce((n, r) => n + r.sites.length, 0));
    expect(map.layoutVersion).toBe(WORLD_LAYOUT.version);
  });

  it("marks only the first region and regions with trees as open", () => {
    expect(map.regions.filter((r) => r.open).map((r) => r.id)).toEqual(["grove"]);
  });

  it("includes the explorer", () => {
    expect(map.explorer).toEqual({ x: 1, z: 2, heading: 0 });
  });
});

describe("resolveMove (spec 20.8)", () => {
  const trunks: CircleCollider[] = plant(12).map((p) => ({ ...p.position, r: 0.3 + TRUNK_CLEARANCE }));
  const grove = WORLD_LAYOUT.regions[0];
  const walkable: CircleCollider[] = [{ x: grove.center.x, z: grove.center.z, r: grove.radius - 1.5 }];

  it("never ends inside a trunk's clearance or outside the walkable area on random walks", () => {
    const rng = createRng(11);
    let pos = { x: WORLD_LAYOUT.entrance.x, z: WORLD_LAYOUT.entrance.z };
    for (let step = 0; step < 4000; step++) {
      const angle = rng() * Math.PI * 2;
      const to = { x: pos.x + Math.cos(angle) * 0.4, z: pos.z + Math.sin(angle) * 0.4 };
      pos = resolveMove(pos, to, trunks, walkable);
      for (const t of trunks) expect(Math.hypot(pos.x - t.x, pos.z - t.z)).toBeGreaterThanOrEqual(t.r - 1e-6);
      expect(Math.hypot(pos.x - grove.center.x, pos.z - grove.center.z)).toBeLessThanOrEqual(walkable[0].r + 1e-6);
    }
  });

  it("slides along a trunk instead of stopping dead", () => {
    const trunk = { x: 0, z: 0, r: 1 };
    const end = resolveMove({ x: -0.2, z: 3 }, { x: 0.1, z: 0.5 }, [trunk], []);
    expect(Math.hypot(end.x, end.z)).toBeCloseTo(1);
    expect(end.z).toBeGreaterThan(0.9);
  });

  it("walking straight at a trunk stops at its clearance", () => {
    const trunk = { x: 0, z: 0, r: 0.65 };
    let pos = { x: 0, z: 5 };
    for (let i = 0; i < 50; i++) pos = resolveMove(pos, { x: pos.x, z: pos.z - 0.2 }, [trunk], []);
    expect(Math.hypot(pos.x, pos.z)).toBeCloseTo(0.65);
  });
});
