/**
 * Sample thoughts for development and review only (spec 20.9). They are
 * planted through the real API path by the dev-only seed, with planting times
 * and care set in the past so every stage and state shows: growing, thirsty,
 * faded, revived, rooted, sunlit and windswept. Nothing is set directly; it
 * all comes from the growth model.
 */
export interface SampleThought {
  content: string;
  /** How many days ago it was planted. */
  plantedDaysAgo: number;
  /** Days ago of each watering (each ≤ plantedDaysAgo). */
  wateredDaysAgo: number[];
  sunlitDaysAgo?: number[];
  windDaysAgo?: number[];
}

/** From `from` days ago down to `to` days ago, every `every` days. */
export function daily(from: number, to: number, every = 1): number[] {
  const out: number[] = [];
  for (let d = from; d >= to; d -= every) out.push(d);
  return out;
}

export const SAMPLE_THOUGHTS: SampleThought[] = [
  // Rooted: watered daily for six weeks, then left alone. Fully Grown forever.
  {
    content: "What if ideas were places instead of posts?",
    plantedDaysAgo: 70,
    wateredDaysAgo: daily(70, 28),
    sunlitDaysAgo: daily(68, 40, 3),
  },
  // Flourishing and healthy: watered every few days, not yet on 30 days.
  {
    content: "Notice how morning shadows stretch longer before the day gets noisy.",
    plantedDaysAgo: 50,
    wateredDaysAgo: daily(50, 2, 3),
    windDaysAgo: daily(45, 5, 4),
  },
  // Thirsty: last watered twelve days ago, so it has stopped growing.
  {
    content: "Some things only become clear after you stop trying to explain them to a crowd.",
    plantedDaysAgo: 16,
    wateredDaysAgo: [16, 12],
  },
  // Faded: no water for more than a month. The thought is still here.
  {
    content: "The urge to publish immediately is often just restlessness looking for validation.",
    plantedDaysAgo: 45,
    wateredDaysAgo: [45, 41],
  },
  // Young and well looked after, with a little sun.
  {
    content: "A seedling does not rush to prove it is an oak. Patience is part of structure.",
    plantedDaysAgo: 5,
    wateredDaysAgo: [5, 4, 3, 1],
    sunlitDaysAgo: [4],
  },
  // A New Thought: planted this morning.
  { content: "Write it down before it becomes an opinion.", plantedDaysAgo: 0.2, wateredDaysAgo: [] },
  // Seedling: yesterday's.
  {
    content: "Leave questions open longer than feels comfortable. Answers arrive in their own time.",
    plantedDaysAgo: 1.5,
    wateredDaysAgo: [1.4],
  },
  // Revived: forgotten for a while, then watered again; it dropped a stage and is growing back.
  {
    content: "Rest is not the absence of progress. Roots grow where nobody is watching.",
    plantedDaysAgo: 30,
    wateredDaysAgo: [...daily(30, 20), ...daily(10, 0, 2)],
  },
  // Windswept and sunlit: lots of reflection and joy.
  {
    content: "Small rooms make big thoughts feel brave.",
    plantedDaysAgo: 24,
    wateredDaysAgo: daily(24, 0, 2),
    sunlitDaysAgo: daily(22, 2, 2),
    windDaysAgo: daily(23, 1, 2),
  },
  // Budding.
  {
    content: "Memory isn't a gallery of snapshots; it's a quiet meadow you can walk through whenever you need ground.",
    plantedDaysAgo: 3,
    wateredDaysAgo: [3, 2],
    windDaysAgo: [1],
  },
];
