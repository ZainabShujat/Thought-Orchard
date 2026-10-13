import { MongoMemoryServer } from "mongodb-memory-server";
import { Db, MongoClient } from "mongodb";
import { ensureIndexes, setTestDb } from "@/server/db/mongo";
import { resetAuthForTests } from "@/server/auth/auth";
import * as authRoute from "@/app/api/auth/[...all]/route";

/**
 * An isolated in-memory MongoDB plus real Better Auth for integration tests.
 * Nothing here touches the developer's `.data/mongo` database.
 */

export const ORIGIN = "http://localhost:3000";

export interface TestDb {
  server: MongoMemoryServer;
  client: MongoClient;
  db: Db;
}

export async function startTestDb(): Promise<TestDb> {
  process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-0000";
  process.env.BETTER_AUTH_URL = ORIGIN;
  process.env.AUTH_RATE_LIMIT = "off";
  const server = await MongoMemoryServer.create();
  const client = await MongoClient.connect(server.getUri());
  const db = client.db(`orchard_test_${Date.now()}`);
  await ensureIndexes(db);
  setTestDb(db, client);
  resetAuthForTests();
  return { server, client, db };
}

export async function stopTestDb(t: TestDb | undefined): Promise<void> {
  setTestDb(undefined);
  resetAuthForTests();
  await t?.client.close();
  await t?.server.stop();
}

export async function clearDb(db: Db): Promise<void> {
  const names = (await db.listCollections().toArray()).map((c) => c.name);
  await Promise.all(names.map((n) => db.collection(n).deleteMany({})));
}

let ipCounter = 1;
/** A distinct client IP per call, so rate limits don't leak between tests. */
export function freshIp(): string {
  ipCounter += 1;
  return `10.0.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
}

export function authRequest(path: string, body?: unknown, init: { cookie?: string; ip?: string; method?: string } = {}) {
  const headers: Record<string, string> = {
    origin: ORIGIN,
    "x-forwarded-for": init.ip ?? "10.9.9.9",
  };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (init.cookie) headers.cookie = init.cookie;
  return new Request(`${ORIGIN}/api/auth${path}`, {
    method: init.method ?? (body === undefined ? "GET" : "POST"),
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function callAuth(path: string, body?: unknown, init: { cookie?: string; ip?: string; method?: string } = {}) {
  const req = authRequest(path, body, init);
  return req.method === "GET" ? authRoute.GET(req) : authRoute.POST(req);
}

/** The session cookie from a response, ready to send back as a Cookie header. */
export function sessionCookie(res: Response): string {
  const cookies = res.headers.getSetCookie();
  const token = cookies.find((c) => /session_token=/.test(c));
  if (!token) throw new Error(`No session cookie (status ${res.status})`);
  return token.split(";")[0];
}

export async function signUp(email: string, password = "correct horse battery", name = "Test Person") {
  const res = await callAuth("/sign-up/email", { email, password, name }, { ip: freshIp() });
  if (!res.ok) throw new Error(`Sign-up failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  return { cookie: sessionCookie(res), userId: body.user.id as string, res };
}

export async function signIn(email: string, password = "correct horse battery") {
  return callAuth("/sign-in/email", { email, password }, { ip: freshIp() });
}

/** A request to the app's own API, authenticated by `cookie` (or not). */
export function apiRequest(url: string, init: { method?: string; body?: unknown; cookie?: string } = {}) {
  const headers: Record<string, string> = { origin: ORIGIN };
  if (init.cookie) headers.cookie = init.cookie;
  if (init.body !== undefined) headers["content-type"] = "application/json";
  return new Request(`${ORIGIN}${url}`, {
    method: init.method ?? (init.body === undefined ? "GET" : "POST"),
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

export const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
export const key = () => `k${Math.random().toString(36).slice(2, 12)}`;
