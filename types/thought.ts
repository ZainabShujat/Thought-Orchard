import type { CareType, GrowthState } from "@/features/growth/growthModel";

/** The seven canonical growth stages (spec section 4). */
export type GrowthStage =
  | "new-thought"
  | "seedling"
  | "budding"
  | "young-tree"
  | "blossoming"
  | "flourishing"
  | "fully-grown";

export interface ThoughtPosition {
  x: number;
  z: number;
}

/** One care action, as stored (spec 9.2). Append-only. */
export interface CareRecord {
  _id: string;
  type: CareType;
  createdAt: string;
}

/**
 * A thought as the client receives it (spec 9.1, 10). The growth stage is
 * not stored anywhere; it is derived from `createdAt` and `care` by
 * `computeGrowth` (spec 4.3). `growth` is the server's derivation at
 * response time, included for convenience.
 */
export interface Thought {
  _id: string;
  orchardId: string;
  content: string;
  position: ThoughtPosition;
  regionId: string;
  /** Seed for the tree's visual identity. Falls back to a hash of `_id`. */
  placementSeed?: number;
  createdAt: string;
  updatedAt: string;
  care: CareRecord[];
  growth?: GrowthState;
}

export interface OrchardMetadata {
  _id: string;
  ownerId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  placementVersion: number;
  growthModelVersion: number;
}
