import { describe, expect, it } from "vitest";
import { ensureThoughtPositions, findNextTreePosition, Placement } from "@/features/placement/placementService";
import { WORLD_LAYOUT, nearestPath, regionAt } from "@/features/world/worldLayout";
import { ThoughtPosition } from "@/types/thought";

const MIN_DISTANCE = 4.8;
const PATH_CLEARANCE = 1.6;

function plantMany(count: number, seed = 42): Placement[] {
  const placed: Placement[] = [];
  for (let i = 0; i < count; i++) {
    placed.push(findNextTreePosition(placed.map((p) => p.position), { seed }));
  }
  return placed;
}

describe("findNextTreePosition (spec 20.7, ADR-004)", () => {
  it("places the first tree at the heart of the grove", () => {
    expect(findNextTreePosition([])).toEqual({ position: { x: 0, z: 0 }, regionId: "grove", siteId: "grove-heart" });
  });

  it("is deterministic for the same inputs", () => {
    expect(plantMany(40)).toEqual(plantMany(40));
  });

  it("never moves existing trees when new ones are added", () => {
    expect(plantMany(40).slice(0, 20)).toEqual(plantMany(20));
  });

  it("keeps the minimum spacing between every pair of trees", () => {
    const positions = plantMany(70).map((p) => p.position);
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const d = Math.hypot(positions[i].x - positions[j].x, positions[i].z - positions[j].z);
        expect(d).toBeGreaterThanOrEqual(MIN_DISTANCE);
      }
    }
  });

  it("keeps every tree off the paths with clearance", () => {
    for (const { position: p } of plantMany(70)) {
      const { distance, halfWidth } = nearestPath(p.x, p.z);
      expect(distance).toBeGreaterThanOrEqual(halfWidth + PATH_CLEARANCE);
    }
  });

  it("puts every tree inside its region and inside a planting site", () => {
    for (const placed of plantMany(70).filter((p) => p.siteId !== "overflow")) {
      const region = WORLD_LAYOUT.regions.find((r) => r.id === placed.regionId)!;
      const site = region.sites.find((s) => s.id === placed.siteId)!;
      const { x, z } = placed.position;
      expect(regionAt(x, z)?.id).toBe(region.id);
      expect(Math.hypot(x - site.center.x, z - site.center.z)).toBeLessThanOrEqual(site.radius + 0.01);
    }
  });

  it("fills the central grove before opening the next region, and sites in order", () => {
    const placed = plantMany(70);
    const firstOther = placed.findIndex((p) => p.regionId !== "grove");
    expect(firstOther).toBeGreaterThan(10);
    expect(placed.slice(firstOther).every((p) => p.regionId !== "grove")).toBe(true);
    // Trees gather in groves: consecutive plantings share a site more often than not.
    const order = WORLD_LAYOUT.regions[0].sites.map((s) => s.id);
    const used = placed.slice(0, firstOther).map((p) => order.indexOf(p.siteId));
    for (let i = 1; i < used.length; i++) expect(used[i]).toBeGreaterThanOrEqual(used[i - 1]);
  });

  it("reuses space freed by a deleted tree without moving anyone else", () => {
    const placed = plantMany(12).map((p) => p.position);
    const withoutThird: ThoughtPosition[] = placed.filter((_, i) => i !== 3);
    const next = findNextTreePosition(withoutThird).position;
    for (const p of withoutThird) {
      expect(Math.hypot(p.x - next.x, p.z - next.z)).toBeGreaterThanOrEqual(MIN_DISTANCE);
    }
  });
});

describe("ensureThoughtPositions", () => {
  it("keeps a stored position, including one at the origin, and derives its region", () => {
    const placed = ensureThoughtPositions([{ id: "a" }, { id: "b", position: { x: 0, z: 0 } }]);
    expect(placed[1].position).toEqual({ x: 0, z: 0 });
    expect(placed[1].regionId).toBe("grove");
  });
});
