import type { CreateIndexesOptions, Db, IndexSpecification } from "mongodb";

/**
 * Every index the app relies on (spec 9.4; ADR-006, ADR-011). Created on
 * every connection (idempotent) and by `npm run db:init`.
 *
 * Better Auth collections: user, session, account, verification, rateLimit.
 * Orchard collections: profiles, orchards, thoughts, careEvents.
 */
export const INDEXES: { collection: string; keys: IndexSpecification; options?: CreateIndexesOptions }[] = [
  // Better Auth
  { collection: "user", keys: { email: 1 }, options: { unique: true } },
  { collection: "session", keys: { token: 1 }, options: { unique: true } },
  { collection: "session", keys: { userId: 1 } },
  // Expired sessions are removed by MongoDB itself.
  { collection: "session", keys: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
  { collection: "account", keys: { userId: 1 } },
  { collection: "account", keys: { providerId: 1, accountId: 1 } },
  { collection: "verification", keys: { identifier: 1 } },
  { collection: "verification", keys: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
  { collection: "rateLimit", keys: { key: 1 }, options: { unique: true } },

  // Orchard data — every query is scoped by owner (userId / ownerId).
  { collection: "orchards", keys: { ownerId: 1 }, options: { unique: true } },
  { collection: "thoughts", keys: { orchardId: 1, createdAt: 1 } },
  { collection: "thoughts", keys: { userId: 1, orchardId: 1 } },
  { collection: "thoughts", keys: { userId: 1, idempotencyKey: 1 }, options: { unique: true } },
  { collection: "careEvents", keys: { thoughtId: 1, createdAt: 1 } },
  { collection: "careEvents", keys: { userId: 1, thoughtId: 1 } },
  { collection: "careEvents", keys: { userId: 1, idempotencyKey: 1 }, options: { unique: true } },
];

export async function ensureIndexes(db: Db): Promise<void> {
  for (const { collection, keys, options } of INDEXES) {
    await db.collection(collection).createIndex(keys, options);
  }
}
