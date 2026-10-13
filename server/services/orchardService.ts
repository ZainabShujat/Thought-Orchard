import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import type { Db } from "mongodb";
import { getDb } from "@/server/db/mongo";
import { now } from "@/server/clock";
import { collections, CareEventDoc, OrchardDoc, ThoughtDoc } from "@/server/repositories/collections";
import { ApiError, isDuplicateKeyError, notFound } from "@/server/services/errors";
import { findNextTreePosition } from "@/features/placement/placementService";
import { WORLD_LAYOUT } from "@/features/world/worldLayout";
import { CareType, GROWTH_MODEL_VERSION, GrowthState, computeGrowth, countedCareTimes } from "@/features/growth/growthModel";
import type { Thought } from "@/types/thought";

/**
 * Thought, care and orchard operations (spec 3, 4, 5, 9, 10). Every query is
 * scoped to the current user's own orchard; nothing here trusts IDs from the
 * client beyond looking them up inside that scope.
 */

const LOCK_MS = 10_000;
const LOCK_RETRY_MS = 50;
const LOCK_MAX_WAIT_MS = 8_000;
/** Abuse limit, not a game rule (spec 10). */
const MAX_CARE_PER_THOUGHT_PER_DAY = 50;

async function database(db?: Db): Promise<Db> {
  return db ?? getDb();
}

export async function getOrCreateOrchard(userId: string, db?: Db): Promise<OrchardDoc> {
  const { orchards } = collections(await database(db));
  const existing = await orchards.findOne({ ownerId: userId });
  if (existing) return existing;

  const at = now();
  const doc: OrchardDoc = {
    _id: randomUUID(),
    ownerId: userId,
    name: "My Orchard",
    createdAt: at,
    updatedAt: at,
    placementVersion: WORLD_LAYOUT.version,
    growthModelVersion: GROWTH_MODEL_VERSION,
    placementSeed: randomInt(1, 2 ** 31 - 1),
    lockUntil: null,
  };
  try {
    await orchards.insertOne(doc);
    return doc;
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
    const raced = await orchards.findOne({ ownerId: userId });
    if (!raced) throw err;
    return raced;
  }
}

/** Runs `fn` while holding the orchard's placement lock (spec 10: atomic placement). */
async function withPlacementLock<T>(orchardId: string, db: Db, fn: () => Promise<T>): Promise<T> {
  const { orchards } = collections(db);
  const started = Date.now();
  for (;;) {
    const t = Date.now();
    const acquired = await orchards.findOneAndUpdate(
      { _id: orchardId, $or: [{ lockUntil: null }, { lockUntil: { $lt: new Date(t) } }] },
      { $set: { lockUntil: new Date(t + LOCK_MS) } }
    );
    if (acquired) break;
    if (t - started > LOCK_MAX_WAIT_MS) {
      throw new ApiError(409, "busy", "The orchard is busy. Please try again.");
    }
    await new Promise((r) => setTimeout(r, LOCK_RETRY_MS + Math.random() * LOCK_RETRY_MS));
  }
  try {
    return await fn();
  } finally {
    await orchards.updateOne({ _id: orchardId }, { $set: { lockUntil: null } });
  }
}

function toDTO(doc: ThoughtDoc, care: CareEventDoc[], at: Date): Thought {
  const records = care
    .filter((c) => c.thoughtId === doc._id)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((c) => ({ _id: c._id, type: c.type, createdAt: c.createdAt.toISOString() }));
  return {
    _id: doc._id,
    orchardId: doc.orchardId,
    content: doc.content,
    position: doc.position,
    regionId: doc.regionId,
    placementSeed: doc.placementSeed,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    care: records,
    growth: computeGrowth(doc.createdAt, records, at.getTime()),
  };
}

export interface ListResult {
  thoughts: Thought[];
  serverNow: string;
}

export async function listThoughts(userId: string, db?: Db): Promise<ListResult> {
  const d = await database(db);
  const orchard = await getOrCreateOrchard(userId, d);
  const { thoughts, careEvents } = collections(d);
  const [docs, care] = await Promise.all([
    thoughts.find({ orchardId: orchard._id, userId }).sort({ createdAt: 1 }).toArray(),
    careEvents.find({ orchardId: orchard._id, userId }).toArray(),
  ]);
  const at = now();
  return { thoughts: docs.map((t) => toDTO(t, care, at)), serverNow: at.toISOString() };
}

async function findOwned(userId: string, id: string, d: Db): Promise<{ orchard: OrchardDoc; doc: ThoughtDoc }> {
  const orchard = await getOrCreateOrchard(userId, d);
  const doc = await collections(d).thoughts.findOne({ _id: id, userId, orchardId: orchard._id });
  if (!doc) throw notFound();
  return { orchard, doc };
}

export async function getThought(userId: string, id: string, db?: Db): Promise<Thought> {
  const d = await database(db);
  const { doc } = await findOwned(userId, id, d);
  const care = await collections(d).careEvents.find({ thoughtId: id, userId }).toArray();
  return toDTO(doc, care, now());
}

export interface CreateInput {
  content: string;
  idempotencyKey: string;
}

/**
 * Plants a thought (spec 3.1, 10). A repeated request with the same
 * idempotency key returns the original thought and plants nothing new.
 * `plantedAt` is for the development seed only.
 */
export async function createThought(
  userId: string,
  input: CreateInput,
  db?: Db,
  options: { plantedAt?: Date } = {}
): Promise<{ thought: Thought; created: boolean }> {
  const d = await database(db);
  const orchard = await getOrCreateOrchard(userId, d);
  const { thoughts, careEvents } = collections(d);

  const replay = async () => {
    const existing = await thoughts.findOne({ userId, idempotencyKey: input.idempotencyKey });
    if (!existing) return null;
    const care = await careEvents.find({ thoughtId: existing._id, userId }).toArray();
    return { thought: toDTO(existing, care, now()), created: false };
  };

  const earlier = await replay();
  if (earlier) return earlier;

  return withPlacementLock(orchard._id, d, async () => {
    const again = await replay();
    if (again) return again;

    const positions = await thoughts
      .find({ orchardId: orchard._id }, { projection: { position: 1 } })
      .sort({ createdAt: 1, _id: 1 })
      .toArray();
    const placed = findNextTreePosition(
      positions.map((p) => p.position),
      { seed: orchard.placementSeed }
    );

    const at = options.plantedAt ?? now();
    const doc: ThoughtDoc = {
      _id: randomUUID(),
      orchardId: orchard._id,
      userId,
      content: input.content,
      position: placed.position,
      regionId: placed.regionId,
      placementSeed: randomInt(1, 2 ** 31 - 1),
      createdAt: at,
      updatedAt: at,
      idempotencyKey: input.idempotencyKey,
    };
    try {
      await thoughts.insertOne(doc);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        const raced = await replay();
        if (raced) return raced;
      }
      throw err;
    }
    return { thought: toDTO(doc, [], now()), created: true };
  });
}

/** Edits content only; ID, createdAt, position, region and care history are untouched (spec 3.2). */
export async function editThought(userId: string, id: string, content: string, db?: Db): Promise<Thought> {
  const d = await database(db);
  const { orchard, doc } = await findOwned(userId, id, d);
  const { thoughts, careEvents } = collections(d);
  let updated = doc;
  if (doc.content !== content) {
    const result = await thoughts.findOneAndUpdate(
      { _id: id, userId, orchardId: orchard._id },
      { $set: { content, updatedAt: now() } },
      { returnDocument: "after" }
    );
    if (!result) throw notFound();
    updated = result;
  }
  const care = await careEvents.find({ thoughtId: id, userId }).toArray();
  return toDTO(updated, care, now());
}

/**
 * Permanent deletion (spec 3.4, C-32). The thought is removed first, then its
 * care events. A retry after a partial failure finds no thought (404) but
 * still clears any leftover care events. No other tree is touched.
 */
export async function deleteThought(userId: string, id: string, db?: Db): Promise<void> {
  const d = await database(db);
  const orchard = await getOrCreateOrchard(userId, d);
  const { thoughts, careEvents } = collections(d);
  const result = await thoughts.deleteOne({ _id: id, userId, orchardId: orchard._id });
  await careEvents.deleteMany({ thoughtId: id, userId, orchardId: orchard._id });
  if (result.deletedCount === 0) throw notFound();
}

export interface CareResult {
  event: { _id: string; type: CareType; createdAt: string };
  /** Whether this care counts (at most one of each type per window). */
  counted: boolean;
  growth: GrowthState;
  stageChanged: boolean;
  /** A watering that brought a weakened tree back (it lost a stage). */
  revived: boolean;
  serverNow: string;
}
/** @deprecated name kept for older callers; same as CareResult. */
export type WaterResult = CareResult;

function describeCare(doc: ThoughtDoc, care: CareEventDoc[], event: CareEventDoc, at: Date): CareResult {
  const records = care.map((c) => ({ _id: c._id, type: c.type, createdAt: c.createdAt.toISOString() }));
  const eventMs = event.createdAt.getTime();
  const counted = countedCareTimes(event.type, doc.createdAt.getTime(), records, eventMs).includes(eventMs);
  const without = records.filter((r) => r._id !== event._id);
  const before = computeGrowth(doc.createdAt, without, eventMs);
  const after = computeGrowth(doc.createdAt, records, eventMs);
  return {
    event: { _id: event._id, type: event.type, createdAt: event.createdAt.toISOString() },
    counted,
    growth: computeGrowth(doc.createdAt, records, at.getTime()),
    stageChanged: after.stageNumber !== before.stageNumber,
    revived: event.type === "water" && before.health === "weak" && after.health === "healthy",
    serverNow: at.toISOString(),
  };
}

/**
 * Cares for a thought with water, sunlight or wind (spec 5). Idempotent: the
 * same key always returns the original result and never creates a second
 * event. A tree that has died can't be cared for; its thought stays readable.
 */
export async function careForThought(
  userId: string,
  id: string,
  type: CareType,
  idempotencyKey: string,
  db?: Db,
  options: { at?: Date } = {}
): Promise<CareResult> {
  const d = await database(db);
  const { orchard, doc } = await findOwned(userId, id, d);
  const { careEvents } = collections(d);

  const replay = async (): Promise<CareResult | null> => {
    const existing = await careEvents.findOne({ userId, idempotencyKey });
    if (!existing) return null;
    if (existing.thoughtId !== id) {
      throw new ApiError(409, "key_reused", "This request key was already used for another tree.");
    }
    const care = await careEvents.find({ thoughtId: id, userId }).toArray();
    return describeCare(doc, care, existing, now());
  };

  const earlier = await replay();
  if (earlier) return earlier;

  const at = options.at ?? now();
  const history = await careEvents.find({ thoughtId: id, userId }).toArray();
  const state = computeGrowth(
    doc.createdAt,
    history.map((c) => ({ _id: c._id, type: c.type, createdAt: c.createdAt })),
    at.getTime()
  );
  if (state.health === "dead") {
    throw new ApiError(409, "faded", "This tree has faded. Its thought is still here to read.");
  }
  const recent = history.filter((c) => c.createdAt.getTime() > at.getTime() - 86_400_000).length;
  if (recent >= MAX_CARE_PER_THOUGHT_PER_DAY) {
    throw new ApiError(429, "too_many", "This tree has had plenty of care today.");
  }

  const event: CareEventDoc = {
    _id: randomUUID(),
    thoughtId: id,
    orchardId: orchard._id,
    userId,
    type,
    createdAt: at,
    idempotencyKey,
  };
  try {
    await careEvents.insertOne(event);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      const raced = await replay();
      if (raced) return raced;
    }
    throw err;
  }
  return describeCare(doc, [...history, event], event, now());
}

/** Waters a thought: `careForThought` with water. */
export function waterThought(
  userId: string,
  id: string,
  idempotencyKey: string,
  db?: Db,
  options: { at?: Date } = {}
): Promise<CareResult> {
  return careForThought(userId, id, "water", idempotencyKey, db, options);
}
