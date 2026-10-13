import "server-only";
import path from "node:path";
import { Db, MongoClient } from "mongodb";
import { getConfig } from "@/server/config";
import { ensureIndexes } from "@/server/db/indexes";

export { ensureIndexes } from "@/server/db/indexes";

/**
 * Database connection (spec 9; ADR-006).
 *
 * - `MONGODB_URI` set: connect to it (any environment).
 * - Development without `MONGODB_URI`: start a local MongoDB that stores its
 *   data in `.data/mongo` (gitignored), so accounts and thoughts survive restarts.
 * - Production without `MONGODB_URI`: `getConfig()` refuses (ConfigError → 503).
 *
 * Tests call `setTestDb` with their own isolated in-memory database.
 */

export interface Mongo {
  db: Db;
  client: MongoClient;
}

interface Cache {
  mongo?: Promise<Mongo>;
  stop?: () => Promise<void>;
}

const globalCache = globalThis as unknown as { __orchardMongo?: Cache };
const cache: Cache = (globalCache.__orchardMongo ??= {});

async function startLocalDevServer(): Promise<string> {
  // Imported lazily: a dev-only dependency, never loaded in production.
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const dbPath = path.join(process.cwd(), ".data", "mongo");
  const { mkdirSync } = await import("node:fs");
  mkdirSync(dbPath, { recursive: true });
  const server = await MongoMemoryServer.create({ instance: { dbPath, storageEngine: "wiredTiger" } });
  cache.stop = async () => {
    await server.stop({ doCleanup: false });
  };
  console.info("[db] Started local development MongoDB (data in .data/mongo)");
  return server.getUri();
}

async function connect(): Promise<Mongo> {
  const config = getConfig();
  const uri = config.mongodbUri ?? (await startLocalDevServer());
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(config.mongodbDb);
  await ensureIndexes(db);
  return { db, client };
}

export function getMongo(): Promise<Mongo> {
  if (!cache.mongo) {
    cache.mongo = connect().catch((err) => {
      cache.mongo = undefined;
      throw err;
    });
  }
  return cache.mongo;
}

export async function getDb(): Promise<Db> {
  return (await getMongo()).db;
}

/** Closes the connection (and the local development database, if one was started). For scripts. */
export async function closeMongo(): Promise<void> {
  const mongo = await cache.mongo?.catch(() => undefined);
  cache.mongo = undefined;
  await mongo?.client.close();
  await cache.stop?.();
  cache.stop = undefined;
}

/** Test hook: use an already-connected, isolated database. */
export function setTestDb(db: Db | undefined, client?: MongoClient): void {
  cache.mongo = db ? Promise.resolve({ db, client: client ?? (undefined as unknown as MongoClient) }) : undefined;
}
