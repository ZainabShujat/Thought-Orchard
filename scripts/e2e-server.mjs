// Starts an isolated server for end-to-end tests: a throwaway in-memory
// MongoDB plus the production build (`next start`). Nothing touches the
// developer's `.data/mongo` database. Run `next build` first.
import { spawn } from "node:child_process";
import { MongoMemoryServer } from "mongodb-memory-server";

const PORT = process.env.E2E_PORT ?? "3100";
const mongo = await MongoMemoryServer.create();

const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "start", "-p", PORT], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    NODE_ENV: "production",
    MONGODB_URI: mongo.getUri(),
    MONGODB_DB: "orchard_e2e",
    BETTER_AUTH_SECRET: "e2e-only-secret-e2e-only-secret-e2e-only-0000",
    BETTER_AUTH_URL: `http://localhost:${PORT}`,
    // Rate limiting is covered by integration tests; e2e signs in many times from one address.
    AUTH_RATE_LIMIT: "off",
  },
});

let stopping = false;
async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  child.kill();
  await mongo.stop().catch(() => undefined);
  process.exit(code);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
child.on("exit", (code) => void shutdown(code ?? 0));
