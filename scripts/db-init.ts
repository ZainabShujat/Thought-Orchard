/**
 * Database initialisation (README "Database"): creates every collection index
 * the app relies on. Safe to run any number of times. The app also does this
 * on every connection; this script lets you do it before the first deploy.
 *
 *   MONGODB_URI=... npm run db:init
 */
import { MongoClient } from "mongodb";
import { INDEXES, ensureIndexes } from "../server/db/indexes";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI to the database you want to initialise.");
    process.exit(1);
  }
  const dbName = process.env.MONGODB_DB ?? "thought_orchard";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    await ensureIndexes(db);
    console.log(`Created or confirmed ${INDEXES.length} indexes in "${dbName}".`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Database initialisation failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
