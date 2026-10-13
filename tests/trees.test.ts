import { describe, expect, it } from "vitest";
import { generateTree } from "@/rendering/trees/treeGenerator";
import { GROWTH_STAGES } from "@/features/growth/stages";
import { PIXEL_ICONS } from "@/components/ui/pixelIcons";
import { ICON_COLORS } from "@/components/ui/pixelIcons";
import { computePixelRatio } from "@/rendering/pixel/usePixelRatio";

describe("generateTree", () => {
  it("is deterministic for a stage and seed", () => {
    for (const { id } of GROWTH_STAGES) {
      expect(generateTree(id, 1234)).toEqual(generateTree(id, 1234));
    }
  });

  it("grows taller with each stage (spec 19.5 reference heights)", () => {
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8];
    const avgHeights = GROWTH_STAGES.map(
      ({ id }) => seeds.reduce((sum, s) => sum + generateTree(id, s).height, 0) / seeds.length
    );
    for (let i = 1; i < avgHeights.length; i++) {
      expect(avgHeights[i]).toBeGreaterThan(avgHeights[i - 1]);
    }
    // Young trees and older are taller than the 2.2 m default eye height.
    expect(avgHeights[3]).toBeGreaterThan(2.2);
    expect(avgHeights[6]).toBeGreaterThan(6);
    expect(avgHeights[6]).toBeLessThan(8);
  });

  it("gives different seeds different shapes", () => {
    expect(generateTree("fully-grown", 1)).not.toEqual(generateTree("fully-grown", 2));
  });
});

describe("pixel icons", () => {
  it("have rectangular grids and only known colours", () => {
    for (const [name, rows] of Object.entries(PIXEL_ICONS)) {
      const width = rows[0].length;
      for (const row of rows) {
        expect(row.length, `${name} row width`).toBe(width);
        for (const ch of row) {
          expect(ch === "." || ch in ICON_COLORS, `${name} colour "${ch}"`).toBe(true);
        }
      }
    }
  });
});

describe("computePixelRatio", () => {
  it("maps each render pixel to a whole number of device pixels", () => {
    const cases: [number, number, number][] = [
      [1920, 1080, 1],
      [390, 844, 3],
      [412, 915, 2.625],
      [1440, 900, 2],
    ];
    for (const [w, h, device] of cases) {
      const { dpr, scale } = computePixelRatio(w, h, device);
      expect(Number.isInteger(scale)).toBe(true);
      expect(device / dpr).toBeCloseTo(scale);
      const shortSide = Math.min(w, h) * dpr;
      expect(shortSide).toBeGreaterThan(160);
      expect(shortSide).toBeLessThan(360);
    }
  });
});
