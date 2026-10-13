/**
 * Sample thoughts for development and review only (spec 20.9). They are
 * planted through the real API path by the dev-only seed endpoint, with
 * planting times and waterings set in the past so every growth stage shows.
 * Stages are never set directly; they come from the growth model.
 */
export interface SampleThought {
  content: string;
  /** How many days ago it was planted. */
  plantedDaysAgo: number;
  /** Days ago of each watering (must be ≤ plantedDaysAgo). */
  wateredDaysAgo: number[];
}

function daily(from: number, to: number, every = 1): number[] {
  const out: number[] = [];
  for (let d = from; d >= to; d -= every) out.push(d);
  return out;
}

export const SAMPLE_THOUGHTS: SampleThought[] = [
  { content: "What if ideas were places instead of posts?", plantedDaysAgo: 70, wateredDaysAgo: daily(70, 40, 3) },
  { content: "Notice how morning shadows stretch longer before the day gets noisy.", plantedDaysAgo: 34, wateredDaysAgo: daily(34, 20, 2) },
  { content: "Some things only become clear after you stop trying to explain them to a crowd.", plantedDaysAgo: 16, wateredDaysAgo: [15, 12] },
  { content: "The urge to publish immediately is often just restlessness looking for validation.", plantedDaysAgo: 8, wateredDaysAgo: [] },
  { content: "A seedling does not rush to prove it is an oak. Patience is part of structure.", plantedDaysAgo: 3.5, wateredDaysAgo: [3] },
  { content: "Leave questions open longer than feels comfortable. Answers arrive in their own time.", plantedDaysAgo: 1.5, wateredDaysAgo: [] },
  { content: "Memory isn't a gallery of snapshots; it's a quiet meadow you can walk through whenever you need ground.", plantedDaysAgo: 64, wateredDaysAgo: daily(64, 50) },
  { content: "Write it down before it becomes an opinion.", plantedDaysAgo: 0.2, wateredDaysAgo: [] },
  { content: "Rest is not the absence of progress. Roots grow where nobody is watching.", plantedDaysAgo: 25, wateredDaysAgo: daily(25, 5, 4) },
  { content: "Small rooms make big thoughts feel brave.", plantedDaysAgo: 12, wateredDaysAgo: daily(12, 1) },
];
