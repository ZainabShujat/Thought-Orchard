import "server-only";
import type { Collection, Db } from "mongodb";
import type { CareType } from "@/features/growth/growthModel";
import type { ThoughtPosition } from "@/types/thought";
import type { Preferences } from "@/types/profile";

/**
 * Stored document shapes (spec 9). IDs are UUID strings except where Better
 * Auth owns the collection. Times are UTC Dates. `userId` / `ownerId` is the
 * Better Auth user ID and is always set by the server from the session.
 */

/** One per user, created at sign-up (ADR-011). `_id` is the user ID. */
export interface ProfileDoc {
  _id: string;
  displayName: string;
  /** Null until onboarding is finished. */
  onboardedAt: Date | null;
  preferences: Preferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrchardDoc {
  _id: string;
  ownerId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  placementVersion: number;
  growthModelVersion: number;
  /** Seed for this orchard's placement; fixed at creation. */
  placementSeed: number;
  /** Short-lived lock so concurrent plantings can't pick overlapping spots. */
  lockUntil: Date | null;
}

export interface ThoughtDoc {
  _id: string;
  orchardId: string;
  userId: string;
  content: string;
  position: ThoughtPosition;
  regionId: string;
  placementSeed: number;
  createdAt: Date;
  updatedAt: Date;
  /** Key of the request that planted it; a retry returns this thought. */
  idempotencyKey: string;
}

export interface CareEventDoc {
  _id: string;
  thoughtId: string;
  orchardId: string;
  userId: string;
  type: CareType;
  createdAt: Date;
  idempotencyKey: string;
}

export function collections(db: Db): {
  profiles: Collection<ProfileDoc>;
  orchards: Collection<OrchardDoc>;
  thoughts: Collection<ThoughtDoc>;
  careEvents: Collection<CareEventDoc>;
} {
  return {
    profiles: db.collection<ProfileDoc>("profiles"),
    orchards: db.collection<OrchardDoc>("orchards"),
    thoughts: db.collection<ThoughtDoc>("thoughts"),
    careEvents: db.collection<CareEventDoc>("careEvents"),
  };
}
