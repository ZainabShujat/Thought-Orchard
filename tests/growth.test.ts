import { describe, expect, it } from "vitest";
import {
  CareInput,
  DAY_MS,
  STAGE_THRESHOLD_DAYS,
  computeGrowth,
  countedWateringTimes,
  lightPointCount,
  LIGHT_POINT_RANGES,
} from "@/features/growth/growthModel";
import { createRng } from "@/lib/random";

const PLANTED = Date.parse("2026-01-01T09:00:00.000Z");
const at = (days: number) => PLANTED + Math.round(days * DAY_MS);

function waterings(days: number[]): CareInput[] {
  return days.map((d, i) => ({ _id: `w${String(i).padStart(4, "0")}`, type: "water", createdAt: new Date(at(d)) }));
}

/** First moment (to 0.01 day) at which the tree is Fully Grown. */
function daysToFullyGrown(care: CareInput[]): number {
  for (let d = 0; d <= 61; d = Math.round((d + 0.01) * 100) / 100) {
    if (computeGrowth(new Date(PLANTED), care, at(d)).stage === "fully-grown") return d;
  }
  return Infinity;
}

const everyNDays = (n: number, until: number) => Array.from({ length: Math.floor(until / n) + 1 }, (_, i) => i * n);

describe("computeGrowth: Option C worked examples (spec 4.2)", () => {
  it("never watered: Fully Grown on day 60", () => {
    expect(daysToFullyGrown([])).toBe(60);
  });

  it("watered every day: Fully Grown on day 40", () => {
    expect(daysToFullyGrown(waterings(everyNDays(1, 60)))).toBe(40);
  });

  it("watered every 3 days: Fully Grown on day 45", () => {
    expect(daysToFullyGrown(waterings(everyNDays(3, 60)))).toBe(45);
  });

  it("30 waterings in the first 30 days, then none: banked care releases, Fully Grown on day 40", () => {
    expect(daysToFullyGrown(waterings(everyNDays(1, 29)))).toBe(40);
  });
});

describe("computeGrowth: rules", () => {
  it("keeps time and care contributions separate", () => {
    const g = computeGrowth(new Date(PLANTED), waterings([0, 1, 2]), at(10));
    expect(g.timeMs).toBe(10 * DAY_MS);
    expect(g.careRawMs).toBe(3 * DAY_MS);
    expect(g.careMs).toBe(3 * DAY_MS);
    expect(g.growthMs).toBe(13 * DAY_MS);
  });

  it("caps care at one third of total growth (care ≤ time / 2)", () => {
    const g = computeGrowth(new Date(PLANTED), waterings(everyNDays(1, 10)), at(10));
    expect(g.careRawMs).toBe(11 * DAY_MS);
    expect(g.careMs).toBe(5 * DAY_MS);
    expect(g.careMs / g.growthMs).toBeCloseTo(1 / 3);
  });

  it("counts at most one watering per 20 hours", () => {
    const care = waterings([0, 0.5, 0.8, 0.84, 2]);
    // 0 counts; 0.5 (12 h) no; 0.8 (19.2 h) no; 0.84 (20.16 h) yes; 2 yes.
    expect(countedWateringTimes(PLANTED, care, at(3))).toEqual([at(0), at(0.84), at(2)]);
  });

  it("ignores waterings before planting or after now", () => {
    const care = waterings([-1, 1, 5]);
    expect(computeGrowth(new Date(PLANTED), care, at(2)).countedWaterings).toBe(1);
  });

  it("ignores sunlight and wind in model version 1", () => {
    const care: CareInput[] = [
      { _id: "s", type: "sunlight", createdAt: new Date(at(1)) },
      { _id: "w", type: "wind", createdAt: new Date(at(2)) },
    ];
    expect(computeGrowth(new Date(PLANTED), care, at(10)).careMs).toBe(0);
  });

  it("uses the stage thresholds exactly", () => {
    STAGE_THRESHOLD_DAYS.forEach((days, i) => {
      expect(computeGrowth(new Date(PLANTED), [], at(days)).stageNumber).toBe(i + 1);
      if (days > 0) expect(computeGrowth(new Date(PLANTED), [], at(days) - 1).stageNumber).toBe(i);
    });
  });

  it("reports progress within the stage, and 1 at Fully Grown", () => {
    expect(computeGrowth(new Date(PLANTED), [], at(5)).progress).toBeCloseTo(0.5); // Budding 3→7
    expect(computeGrowth(new Date(PLANTED), [], at(90)).progress).toBe(1);
  });

  it("is reproducible: same inputs, same result", () => {
    const care = waterings([0, 2, 5, 9]);
    expect(computeGrowth(new Date(PLANTED), care, at(12))).toEqual(
      computeGrowth(new Date(PLANTED).toISOString(), [...care].reverse(), at(12))
    );
  });

  it("never reverses: growth is monotonic over time and as care is added", () => {
    const rng = createRng(7);
    for (let trial = 0; trial < 50; trial++) {
      const days = Array.from({ length: 1 + Math.floor(rng() * 40) }, () => Math.round(rng() * 80 * 100) / 100).sort(
        (a, b) => a - b
      );
      const care = waterings(days);
      let prev = -1;
      for (let d = 0; d <= 90; d += 0.5) {
        const g = computeGrowth(new Date(PLANTED), care, at(d));
        expect(g.growthMs).toBeGreaterThanOrEqual(prev);
        prev = g.growthMs;
      }
      // Appending a watering never lowers growth at the same moment.
      const before = computeGrowth(new Date(PLANTED), care, at(85)).growthMs;
      const after = computeGrowth(new Date(PLANTED), [...care, ...waterings([84.5]).map((c) => ({ ...c, _id: "zz" }))], at(85)).growthMs;
      expect(after).toBeGreaterThanOrEqual(before);
    }
  });
});

describe("lightPointCount (spec 4.6)", () => {
  it("stays within each stage's range and rises with care", () => {
    LIGHT_POINT_RANGES.forEach(([min, max], i) => {
      const stageNumber = i + 1;
      const untended = lightPointCount({ stageNumber, progress: 0, countedWaterings: 0 });
      const tended = lightPointCount({ stageNumber, progress: 1, countedWaterings: 50 });
      expect(untended).toBe(min);
      expect(tended).toBe(max);
      expect(lightPointCount({ stageNumber, progress: 0.5, countedWaterings: 1 })).toBeGreaterThanOrEqual(min);
    });
  });
});
