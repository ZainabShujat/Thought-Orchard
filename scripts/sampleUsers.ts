/**
 * Sample accounts for local development and review only (spec 20.9). They are
 * created by `npm run db:seed` in a local database and never in production.
 * The passwords are throwaway test values, not real credentials.
 */
import { DEV_REVIEW_ACCOUNT } from "../e2e/fixtures/accounts";
import { SAMPLE_THOUGHTS, SampleThought } from "../features/thoughts/sampleThoughts";

export interface SampleUser {
  name: string;
  email: string;
  password: string;
  /** False leaves the account at the onboarding step. */
  onboarded: boolean;
  thoughts: SampleThought[];
}

const SEEDLING_THOUGHTS: SampleThought[] = [
  { content: "Today I want to notice one small thing that went right.", plantedDaysAgo: 2, wateredDaysAgo: [1] },
  { content: "Maybe the walk home is the best part of the day.", plantedDaysAgo: 0.5, wateredDaysAgo: [] },
  { content: "Start smaller than feels useful.", plantedDaysAgo: 4, wateredDaysAgo: [3, 2] },
];

const GROVE_THOUGHTS: SampleThought[] = [
  ...SAMPLE_THOUGHTS,
  { content: "Old notebooks are proof that I kept going.", plantedDaysAgo: 90, wateredDaysAgo: [88, 80, 70, 60] },
  { content: "The kettle takes three minutes. That's enough time to breathe.", plantedDaysAgo: 45, wateredDaysAgo: [44, 40, 35, 30, 25] },
  { content: "A good question is worth carrying around for a while.", plantedDaysAgo: 58, wateredDaysAgo: [57, 50] },
  { content: "Some friendships are gardens; some are weather. Both are fine.", plantedDaysAgo: 20, wateredDaysAgo: [18, 14, 10, 6, 2] },
  { content: "I don't have to finish every thought today.", plantedDaysAgo: 6, wateredDaysAgo: [5] },
];

export const SAMPLE_USERS: SampleUser[] = [
  // The account the review checklist and visual review use: every growth stage.
  { ...DEV_REVIEW_ACCOUNT, onboarded: true, thoughts: SAMPLE_THOUGHTS },
  // Signed up but not onboarded, with an empty orchard: the first-run experience.
  {
    name: "Sample Newcomer",
    email: "newcomer@example.test",
    password: "orchard-newcomer-2026-local",
    onboarded: false,
    thoughts: [],
  },
  // A few days in: only the earliest stages.
  {
    name: "Sample Seedling",
    email: "seedling@example.test",
    password: "orchard-seedling-2026-local",
    onboarded: true,
    thoughts: SEEDLING_THOUGHTS,
  },
  // A long-kept orchard spread across more of the map.
  {
    name: "Sample Grove",
    email: "grove@example.test",
    password: "orchard-grove-2026-local",
    onboarded: true,
    thoughts: GROVE_THOUGHTS,
  },
];
