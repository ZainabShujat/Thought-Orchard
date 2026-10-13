import type { GrowthStage, Thought } from "@/types/thought";
import { getTerrainHeight } from "@/rendering/environment/terrain";
import { getTreeModel } from "@/rendering/trees/treeIdentity";
import { EYE_HEIGHT, ExplorerState, PITCH_MAX, PITCH_MIN, headingTo } from "@/rendering/movement/explorerState";

/**
 * Turns the Immersive view to frame a tree for reading (spec 20.2). On narrow
 * screens the letter panel covers the lower part of the view, so the tree is
 * framed above centre to stay visible.
 */
export function aimAtTree(state: ExplorerState, thought: Pick<Thought, "_id" | "placementSeed" | "position">, stage: GrowthStage, narrowScreen: boolean): void {
  const model = getTreeModel(thought, stage);
  const { x, z } = thought.position;
  const dist = Math.max(0.5, Math.hypot(x - state.x, z - state.z));
  const eyeY = getTerrainHeight(state.x, state.z) + EYE_HEIGHT;
  // Aim between the base and the canopy, so small trees and tall trees both read.
  const aimY = getTerrainHeight(x, z) + Math.min(model.canopyCenter[1], 2.5);
  const angle = Math.atan2(aimY - eyeY, dist);
  // On phones the letter panel covers roughly the lower half, so frame the tree well above centre.
  const raise = narrowScreen ? (22 * Math.PI) / 180 : 0;
  state.faceHeading = headingTo(state, thought.position);
  state.pitch = Math.min(PITCH_MAX, Math.max(PITCH_MIN, angle - raise));
}

/**
 * Frames the explorer and a tree in the Explorer view (spec 20.3). The camera
 * centres between them; on wide screens it shifts so the pair sits left of
 * centre, clear of the letter panel on the right.
 */
export function frameInExplorer(state: ExplorerState, tree: { x: number; z: number }, narrowScreen: boolean): void {
  state.faceHeading = headingTo(state, tree);
  const midX = (tree.x - state.x) / 2;
  const midZ = (tree.z - state.z) / 2;
  // Camera right vector on the ground for the current view yaw.
  const rightX = Math.cos(state.explorerYaw);
  const rightZ = -Math.sin(state.explorerYaw);
  const shift = narrowScreen ? 0 : state.explorerDistance * 0.17;
  // Narrow screens: the panel is at the bottom, so move the pair up the screen instead.
  const upX = -Math.sin(state.explorerYaw);
  const upZ = -Math.cos(state.explorerYaw);
  const lift = narrowScreen ? -state.explorerDistance * 0.12 : 0;
  state.lookOffset = { x: midX + rightX * shift + upX * lift, z: midZ + rightZ * shift + upZ * lift };
}

export function isNarrowScreen(): boolean {
  return typeof window !== "undefined" && window.innerWidth < 768;
}
