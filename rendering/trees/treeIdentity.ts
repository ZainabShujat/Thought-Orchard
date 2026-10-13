import { GrowthStage, Thought } from "@/types/thought";
import { hashString } from "@/lib/random";
import { generateTree, TreeModel } from "@/rendering/trees/treeGenerator";

/** The seed that gives a thought's tree its stable visual identity across all stages. */
export function getTreeSeed(thought: Pick<Thought, "_id" | "placementSeed">): number {
  return thought.placementSeed ?? hashString(thought._id);
}

export function getTreeModel(thought: Pick<Thought, "_id" | "placementSeed">, stage: GrowthStage): TreeModel {
  return generateTree(stage, getTreeSeed(thought));
}
