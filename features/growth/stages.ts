import type { GrowthStage } from "@/types/thought";

/**
 * The seven canonical growth stages (spec section 4), in order.
 * How a thought moves between stages is still open (OD-03/OD-04);
 * this module only defines the stages themselves.
 */
export const GROWTH_STAGES: readonly { id: GrowthStage; label: string }[] = [
  { id: "new-thought", label: "New Thought" },
  { id: "seedling", label: "Seedling" },
  { id: "budding", label: "Budding" },
  { id: "young-tree", label: "Young Tree" },
  { id: "blossoming", label: "Blossoming" },
  { id: "flourishing", label: "Flourishing" },
  { id: "fully-grown", label: "Fully Grown" },
];

export function getStageLabel(stage: GrowthStage): string {
  return GROWTH_STAGES.find((s) => s.id === stage)?.label ?? stage;
}

/** 1-based position of the stage, e.g. "fully-grown" -> 7. */
export function getStageNumber(stage: GrowthStage): number {
  return GROWTH_STAGES.findIndex((s) => s.id === stage) + 1;
}
