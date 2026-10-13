import { describe, expect, it } from "vitest";
import {
  CareInput,
  CareType,
  DAY_MS,
  DIE_AFTER_DAYS,
  STAGE_THRESHOLD_DAYS,
  WEAKEN_AFTER_DAYS,
  careLevel,
  computeGrowth,
  countedWateringTimes,
  lightPointCount,
  LIGHT_POINT_RANGES,
} from "@/features/growth/growthModel";
import { createRng } from "@/lib/random";

const PLANTED = Date.parse("2026-01-01T09:00:00.000Z");
const at = (days: number) => PLANTED + Math.round(days * DAY_MS);

function care(type: CareType, days: number[], prefix = type[0]): CareInput[] {
  return days.map((d, i) => ({ _id: `${prefix}${String(i).padStart(4, "0")}`, type, createdAt: new Date(at(d)) }));
}
const waterings = (days: number[]) => care("water", days);
const grow = (c: CareInput[], days: number) => computeGrowth(new Date(PLANTED), c, at(days));

/** First moment (to 0.01 day) at which the tree is Fully Grown. */
function daysToFullyGrown(c: CareInput[], until = 120): number {
  for (let d = 0; d <= until; d = Math.round((d + 0.01) * 100) / 100) {
    if (grow(c, d).stage === "fully-grown") return d;
  }
  return Infinity;
}

const everyNDays = (n: number, until: number) => Array.from({ length: Math.floor(until / n) + 1 }, (_, i) => i * n);

describe("growth: worked examples", () => {
  it("watered every day: Fully Grown on day 40, rooted", () => {
    const c = waterings(everyNDays(1, 60));
    expect(daysToFullyGrown(c)).toBe(40);
    expect(grow(c, 40).rooted).toBe(true);
  });

  it("watered every 3 days: stops at Flourishing until it has been watered on 30 days", () => {
    const c = waterings(everyNDays(3, 120));
    expect(grow(c, 60).stage).toBe("flourishing");
    expect(grow(c, 60).health).toBe("healthy");
    // The 30th watering day is day 87.
    expect(grow(c, 86.9).stage).toBe("flourishing");
    expect(daysToFullyGrown(c)).toBeCloseTo(87, 1);
  });

  it("never watered: weakens after a week and dies after a month, as a Young Tree", () => {
    expect(grow([], WEAKEN_AFTER_DAYS - 0.01).health).toBe("healthy");
    expect(grow([], WEAKEN_AFTER_DAYS).health).toBe("weak");
    expect(grow([], WEAKEN_AFTER_DAYS).stage).toBe("young-tree");
    expect(grow([], DIE_AFTER_DAYS - 0.01).health).toBe("weak");
    expect(grow([], DIE_AFTER_DAYS).health).toBe("dead");
    expect(grow([], DIE_AFTER_DAYS).stage).toBe("young-tree");
  });
});

describe("growth: fading and revival", () => {
  it("a weak tree stops growing", () => {
    const c = waterings([0]);
    expect(grow(c, 8).health).toBe("weak");
    expect(grow(c, 20).growthMs).toBe(grow(c, 8).growthMs);
  });

  it("watering a weak tree revives it but costs one stage", () => {
    // Watered on day 0 only: weak from day 7 at Young Tree (7 days + 1 bonus = 8).
    const before = grow(waterings([0]), 10);
    expect(before.health).toBe("weak");
    expect(before.stage).toBe("young-tree");
    const after = grow(waterings([0, 10]), 10);
    expect(after.health).toBe("healthy");
    expect(after.stage).toBe("budding");
    expect(after.stagesLost).toBe(1);
    // It grows again from the start of Budding.
    expect(grow(waterings([0, 10]), 12).growthMs).toBe(STAGE_THRESHOLD_DAYS[2] * DAY_MS + 2 * DAY_MS);
  });

  it("each late watering costs a stage again", () => {
    // Every 8 days: weak each time at Young Tree, revived each time to Budding.
    const g = grow(waterings([0, 8, 16, 24]), 24);
    expect(g.stagesLost).toBe(3);
    expect(g.stage).toBe("budding");
  });

  it("a revived New Thought can't drop below the first stage", () => {
    // Planted, weak and revived before it ever reaches Seedling is impossible (weak takes 7 days),
    // so check the floor directly: a revival from Seedling lands on New Thought.
    const g = grow(waterings([0.5, 7.6]), 7.6);
    expect(g.stagesLost).toBe(1);
    expect(g.stageNumber).toBeGreaterThanOrEqual(1);
  });

  it("a dead tree stays dead, even if watered later", () => {
    const c = waterings([0, 35]);
    expect(grow(c, 40).health).toBe("dead");
    expect(grow(c, 40).countedWaterings).toBe(1);
  });

  it("watering every 6 days keeps a tree healthy", () => {
    const c = waterings(everyNDays(6, 60));
    for (let d = 0; d <= 60; d += 0.5) expect(grow(c, d).health).toBe("healthy");
  });

  it("a Fully Grown tree is rooted and never fades", () => {
    const c = waterings(everyNDays(1, 40));
    const later = grow(c, 400);
    expect(later.stage).toBe("fully-grown");
    expect(later.health).toBe("healthy");
    expect(later.rooted).toBe(true);
    expect(later.weakensAt).toBeNull();
    expect(later.diesAt).toBeNull();
  });

  it("reports when the tree will weaken and die", () => {
    const g = grow(waterings([0, 2]), 3);
    expect(g.weakensAt).toBe(new Date(at(2 + WEAKEN_AFTER_DAYS)).toISOString());
    expect(g.diesAt).toBe(new Date(at(2 + DIE_AFTER_DAYS)).toISOString());
  });
});

describe("growth: rules", () => {
  it("caps care at a third of growth (bonus ≤ healthy time / 2)", () => {
    const g = grow(waterings(everyNDays(1, 10)), 10);
    expect(g.growthMs).toBe(15 * DAY_MS);
  });

  it("counts at most one watering per 20 hours", () => {
    const c = waterings([0, 0.5, 0.8, 0.84, 2]);
    // 0 counts; 0.5 (12 h) no; 0.8 (19.2 h) no; 0.84 (20.16 h) yes; 2 yes.
    expect(countedWateringTimes(PLANTED, c, at(3))).toEqual([at(0), at(0.84), at(2)]);
  });

  it("ignores waterings before planting or after now", () => {
    expect(grow(waterings([-1, 1, 5]), 2).countedWaterings).toBe(1);
  });

  it("sunlight and wind change the look, not growth or fading", () => {
    const water = waterings([0, 3]);
    const extra = [...water, ...care("sunlight", [1, 2, 5, 6]), ...care("wind", [1])];
    const plain = grow(water, 12);
    const tended = grow(extra, 12);
    expect(tended.growthMs).toBe(plain.growthMs);
    expect(tended.health).toBe(plain.health);
    expect(tended.sunlightDays).toBe(4);
    expect(tended.sunlightLevel).toBe(2);
    expect(tended.windLevel).toBe(1);
  });

  it("care levels rise at 1, 4 and 10 days", () => {
    expect([0, 1, 3, 4, 9, 10, 50].map(careLevel)).toEqual([0, 1, 1, 2, 2, 3, 3]);
  });

  it("uses the stage thresholds while healthy", () => {
    const c = waterings(everyNDays(1, 5));
    // With daily watering for the first days, growth is 1.5× time.
    expect(grow(c, 2).stage).toBe("budding"); // 3 days of growth
    expect(grow([], 1).stage).toBe("seedling");
    expect(grow([], 1 - 1 / 86_400_000).stage).toBe("new-thought");
  });

  it("is reproducible and independent of input order", () => {
    const c = [...waterings([0, 2, 5, 9, 20]), ...care("sunlight", [3])];
    expect(grow(c, 25)).toEqual(computeGrowth(new Date(PLANTED).toISOString(), [...c].reverse(), at(25)));
  });

  it("while it is kept watered, growth never goes backwards", () => {
    const rng = createRng(7);
    for (let trial = 0; trial < 30; trial++) {
      // Waterings no more than 6 days apart: never weak, so never a stage lost.
      const days: number[] = [0];
      while (days[days.length - 1] < 80) days.push(days[days.length - 1] + 0.5 + Math.round(rng() * 550) / 100);
      const c = waterings(days);
      let prev = -1;
      for (let d = 0; d <= 80; d += 0.5) {
        const g = grow(c, d);
        expect(g.growthMs).toBeGreaterThanOrEqual(prev);
        expect(g.stagesLost).toBe(0);
        prev = g.growthMs;
      }
    }
  });
});

describe("lightPointCount (spec 4.6)", () => {
  it("stays within each stage's range and rises with care", () => {
    LIGHT_POINT_RANGES.forEach(([min, max], i) => {
      const stageNumber = i + 1;
      expect(lightPointCount({ stageNumber, progress: 0, countedWaterings: 0 })).toBe(min);
      expect(lightPointCount({ stageNumber, progress: 1, countedWaterings: 50 })).toBe(max);
    });
  });

  it("dims when weak, goes out when dead, and sunlight adds a few", () => {
    const base = { stageNumber: 6, progress: 1, countedWaterings: 50 };
    expect(lightPointCount({ ...base, health: "weak" })).toBe(7);
    expect(lightPointCount({ ...base, health: "dead" })).toBe(0);
    expect(lightPointCount({ ...base, sunlightLevel: 3 })).toBe(17);
  });
});
