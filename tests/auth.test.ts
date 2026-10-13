import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as thoughtsRoute from "@/app/api/thoughts/route";
import * as thoughtRoute from "@/app/api/thoughts/[id]/route";
import * as careRoute from "@/app/api/thoughts/[id]/care/route";
import * as profileRoute from "@/app/api/profile/route";
import * as seedRoute from "@/app/api/dev/seed/route";
import * as clockRoute from "@/app/api/dev/clock/route";
import { resetAuthForTests } from "@/server/auth/auth";
import { ConfigError, getConfig } from "@/server/config";
import type { Thought } from "@/types/thought";
import {
  TestDb,
  apiRequest,
  callAuth,
  clearDb,
  ctx,
  freshIp,
  key,
  sessionCookie,
  signIn,
  signUp,
  startTestDb,
  stopTestDb,
} from "./support/testServer";

let t: TestDb;

beforeAll(async () => {
  t = await startTestDb();
});

afterAll(async () => {
  await stopTestDb(t);
});

beforeEach(async () => {
  await clearDb(t.db);
});

const PASSWORD = "correct horse battery";

async function plantAs(cookie: string, content: string): Promise<Thought> {
  const res = await thoughtsRoute.POST(apiRequest("/api/thoughts", { body: { content, idempotencyKey: key() }, cookie }));
  expect(res.status).toBe(201);
  return (await res.json()).thought;
}

describe("registration (ADR-011)", () => {
  it("creates the user, a session cookie with safe attributes, a profile and one private orchard", async () => {
    const { userId, res } = await signUp("new@example.com", PASSWORD, "Zee");
    const setCookie = res.headers.getSetCookie().find((c) => c.includes("session_token="))!;
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(setCookie).toMatch(/Path=\//i);

    expect(await t.db.collection("profiles").findOne({ _id: userId as never })).toMatchObject({ displayName: "Zee", onboardedAt: null });
    expect(await t.db.collection("orchards").countDocuments({ ownerId: userId })).toBe(1);
  });

  it("never stores the password in plaintext", async () => {
    const { userId } = await signUp("hash@example.com", PASSWORD);
    const all = JSON.stringify(await Promise.all(["user", "account", "session", "profiles"].map((c) => t.db.collection(c).find().toArray())));
    expect(all).not.toContain(PASSWORD);
    const account = await t.db.collection("account").findOne({});
    expect(typeof account?.password).toBe("string");
    expect(account?.password).not.toBe(PASSWORD);
    expect(String(account?.userId)).toBe(userId);
  });

  it("rejects a duplicate email without creating a second account", async () => {
    await signUp("dup@example.com");
    const res = await callAuth("/sign-up/email", { email: "dup@example.com", password: PASSWORD, name: "Two" }, { ip: freshIp() });
    expect(res.ok).toBe(false);
    expect(await t.db.collection("user").countDocuments({ email: "dup@example.com" })).toBe(1);
  });

  it("rejects short passwords and invalid emails", async () => {
    const short = await callAuth("/sign-up/email", { email: "short@example.com", password: "short", name: "S" }, { ip: freshIp() });
    expect(short.ok).toBe(false);
    const bad = await callAuth("/sign-up/email", { email: "not-an-email", password: PASSWORD, name: "B" }, { ip: freshIp() });
    expect(bad.ok).toBe(false);
    expect(await t.db.collection("user").countDocuments()).toBe(0);
  });
});

describe("sign-in, sessions and sign-out", () => {
  it("rejects wrong passwords and unknown emails with the same answer", async () => {
    await signUp("login@example.com");
    const wrong = await signIn("login@example.com", "wrong password here");
    const unknown = await signIn("nobody@example.com", PASSWORD);
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(await wrong.json()).toEqual(await unknown.json());
  });

  it("signs in, then signs out so the old session no longer works", async () => {
    await signUp("out@example.com");
    const res = await signIn("out@example.com");
    expect(res.ok).toBe(true);
    const cookie = sessionCookie(res);
    expect((await thoughtsRoute.GET(apiRequest("/api/thoughts", { cookie }))).status).toBe(200);

    const out = await callAuth("/sign-out", {}, { cookie });
    expect(out.ok).toBe(true);
    expect((await thoughtsRoute.GET(apiRequest("/api/thoughts", { cookie }))).status).toBe(401);
  });

  it("treats an expired session as signed out", async () => {
    const { cookie } = await signUp("expired@example.com");
    await t.db.collection("session").updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await thoughtsRoute.GET(apiRequest("/api/thoughts", { cookie }))).status).toBe(401);
  });

  it("rejects a forged or tampered session cookie", async () => {
    const { cookie } = await signUp("forged@example.com");
    const tampered = cookie.replace(/=(.)/, (_, c) => `=${c === "a" ? "b" : "a"}`);
    expect((await thoughtsRoute.GET(apiRequest("/api/thoughts", { cookie: tampered }))).status).toBe(401);
    expect((await thoughtsRoute.GET(apiRequest("/api/thoughts", { cookie: "better-auth.session_token=made-up" }))).status).toBe(401);
  });

  it("requires a session for every private endpoint", async () => {
    const id = "00000000-0000-4000-8000-000000000000";
    const results = await Promise.all([
      thoughtsRoute.GET(apiRequest("/api/thoughts")),
      thoughtsRoute.POST(apiRequest("/api/thoughts", { body: { content: "x", idempotencyKey: key() } })),
      thoughtRoute.GET(apiRequest(`/api/thoughts/${id}`), ctx(id)),
      thoughtRoute.PATCH(apiRequest(`/api/thoughts/${id}`, { method: "PATCH", body: { content: "x" } }), ctx(id)),
      thoughtRoute.DELETE(apiRequest(`/api/thoughts/${id}`, { method: "DELETE" }), ctx(id)),
      careRoute.POST(apiRequest(`/api/thoughts/${id}/care`, { body: { type: "water", idempotencyKey: key() } }), ctx(id)),
      profileRoute.GET(apiRequest("/api/profile")),
      profileRoute.PATCH(apiRequest("/api/profile", { method: "PATCH", body: { displayName: "x" } })),
      seedRoute.POST(apiRequest("/api/dev/seed", { body: {} })),
      clockRoute.POST(apiRequest("/api/dev/clock", { body: { offsetDays: 1 } })),
    ]);
    expect(results.map((r) => r.status)).toEqual(Array(results.length).fill(401));
  });
});

describe("account isolation", () => {
  it("account A can't read, edit, water or delete account B's thoughts, even with B's IDs", async () => {
    const a = await signUp("a@example.com");
    const b = await signUp("b@example.com");
    const secret = await plantAs(b.cookie, "B's private thought");
    const id = secret._id;

    expect((await (await thoughtsRoute.GET(apiRequest("/api/thoughts", { cookie: a.cookie }))).json()).thoughts).toEqual([]);
    expect((await thoughtRoute.GET(apiRequest(`/api/thoughts/${id}`, { cookie: a.cookie }), ctx(id))).status).toBe(404);
    expect(
      (await thoughtRoute.PATCH(apiRequest(`/api/thoughts/${id}`, { method: "PATCH", body: { content: "hacked" }, cookie: a.cookie }), ctx(id))).status
    ).toBe(404);
    expect(
      (await careRoute.POST(apiRequest(`/api/thoughts/${id}/care`, { body: { type: "water", idempotencyKey: key() }, cookie: a.cookie }), ctx(id))).status
    ).toBe(404);
    expect((await thoughtRoute.DELETE(apiRequest(`/api/thoughts/${id}`, { method: "DELETE", cookie: a.cookie }), ctx(id))).status).toBe(404);

    // B's thought is untouched.
    const still = (await (await thoughtsRoute.GET(apiRequest("/api/thoughts", { cookie: b.cookie }))).json()).thoughts;
    expect(still).toHaveLength(1);
    expect(still[0].content).toBe("B's private thought");
    expect(still[0].care).toHaveLength(0);
  });

  it("gives each account its own orchard, and the same idempotency key means different things per account", async () => {
    const a = await signUp("a2@example.com");
    const b = await signUp("b2@example.com");
    const k = "shared-request-key";
    const ra = await thoughtsRoute.POST(apiRequest("/api/thoughts", { body: { content: "A", idempotencyKey: k }, cookie: a.cookie }));
    const rb = await thoughtsRoute.POST(apiRequest("/api/thoughts", { body: { content: "B", idempotencyKey: k }, cookie: b.cookie }));
    expect(ra.status).toBe(201);
    expect(rb.status).toBe(201);
    const ta = (await ra.json()).thought as Thought;
    const tb = (await rb.json()).thought as Thought;
    expect(ta.orchardId).not.toBe(tb.orchardId);
    // Both are the first tree in their own orchard.
    expect(ta.position).toEqual({ x: 0, z: 0 });
    expect(tb.position).toEqual({ x: 0, z: 0 });
  });

  it("stores the owner from the session, ignoring anything the client sends", async () => {
    const a = await signUp("owner@example.com");
    const res = await thoughtsRoute.POST(
      apiRequest("/api/thoughts", { body: { content: "x", idempotencyKey: key(), userId: "victim" }, cookie: a.cookie })
    );
    expect(res.status).toBe(400);
    const ok = await plantAs(a.cookie, "mine");
    const doc = await t.db.collection("thoughts").findOne({ _id: ok._id as never });
    expect(doc?.userId).toBe(a.userId);
  });
});

describe("profile and onboarding", () => {
  it("starts un-onboarded, saves name and preferences, and completes onboarding", async () => {
    const { cookie } = await signUp("profile@example.com", PASSWORD, "First");
    const start = (await (await profileRoute.GET(apiRequest("/api/profile", { cookie }))).json()).profile;
    expect(start).toMatchObject({ displayName: "First", email: "profile@example.com", onboarded: false });

    const res = await profileRoute.PATCH(
      apiRequest("/api/profile", {
        method: "PATCH",
        body: { displayName: "Zee", preferences: { plainFont: true, motion: "reduce", startView: "explorer" }, completeOnboarding: true },
        cookie,
      })
    );
    const updated = (await res.json()).profile;
    expect(updated).toMatchObject({
      displayName: "Zee",
      onboarded: true,
      preferences: { plainFont: true, motion: "reduce", startView: "explorer" },
    });

    // Persisted: a fresh sign-in sees the same profile.
    const again = sessionCookie(await signIn("profile@example.com"));
    expect((await (await profileRoute.GET(apiRequest("/api/profile", { cookie: again }))).json()).profile).toMatchObject(updated);
  });

  it("validates profile updates", async () => {
    const { cookie } = await signUp("validate@example.com");
    const patch = (body: unknown) => profileRoute.PATCH(apiRequest("/api/profile", { method: "PATCH", body, cookie }));
    expect((await patch({ displayName: "   " })).status).toBe(400);
    expect((await patch({ preferences: { motion: "wild" } })).status).toBe(400);
    expect((await patch({ email: "other@example.com" })).status).toBe(400);
  });
});

describe("password reset and change", () => {
  it("resets a password with the emailed link and revokes old sessions", async () => {
    const { cookie: oldSession } = await signUp("reset@example.com");
    const logs: string[] = [];
    const spy = vi.spyOn(console, "info").mockImplementation((...args) => void logs.push(args.join(" ")));
    const req = await callAuth("/request-password-reset", { email: "reset@example.com", redirectTo: "/reset-password" }, { ip: freshIp() });
    spy.mockRestore();
    expect(req.ok).toBe(true);
    const link = logs.join("\n").match(/https?:\/\/\S+/)?.[0];
    expect(link).toBeTruthy();
    const token = new URL(link!).pathname.split("/").pop() || new URL(link!).searchParams.get("token");
    expect(token).toBeTruthy();

    const reset = await callAuth("/reset-password", { newPassword: "a brand new password", token }, { ip: freshIp() });
    expect(reset.ok).toBe(true);
    expect((await signIn("reset@example.com", PASSWORD)).status).toBe(401);
    expect((await signIn("reset@example.com", "a brand new password")).ok).toBe(true);
    expect((await thoughtsRoute.GET(apiRequest("/api/thoughts", { cookie: oldSession }))).status).toBe(401);
  });

  it("doesn't reveal whether an email has an account when requesting a reset", async () => {
    const a = await callAuth("/request-password-reset", { email: "nobody@example.com", redirectTo: "/reset-password" }, { ip: freshIp() });
    expect(a.ok).toBe(true);
  });

  it("changes the password only with the current password", async () => {
    const { cookie } = await signUp("change@example.com");
    const wrong = await callAuth("/change-password", { currentPassword: "not my password", newPassword: "another good password" }, { cookie, ip: freshIp() });
    expect(wrong.ok).toBe(false);
    const ok = await callAuth("/change-password", { currentPassword: PASSWORD, newPassword: "another good password" }, { cookie, ip: freshIp() });
    expect(ok.ok).toBe(true);
    expect((await signIn("change@example.com", "another good password")).ok).toBe(true);
  });
});

describe("account deletion (spec 17.4)", () => {
  it("removes the profile, orchard, thoughts, care events, sessions and credentials, and nobody else's", async () => {
    const a = await signUp("leaving@example.com");
    const b = await signUp("staying@example.com");
    const thought = await plantAs(a.cookie, "goodbye");
    await careRoute.POST(apiRequest(`/api/thoughts/${thought._id}/care`, { body: { type: "water", idempotencyKey: key() }, cookie: a.cookie }), ctx(thought._id));
    await plantAs(b.cookie, "still here");

    const wrong = await callAuth("/delete-user", { password: "not my password" }, { cookie: a.cookie, ip: freshIp() });
    expect(wrong.ok).toBe(false);
    expect(await t.db.collection("thoughts").countDocuments({ userId: a.userId })).toBe(1);

    const res = await callAuth("/delete-user", { password: PASSWORD }, { cookie: a.cookie, ip: freshIp() });
    expect(res.ok).toBe(true);

    for (const [c, filter] of [
      ["thoughts", { userId: a.userId }],
      ["careEvents", { userId: a.userId }],
      ["orchards", { ownerId: a.userId }],
      ["profiles", { _id: a.userId }],
      ["account", {}],
    ] as const) {
      const n = await t.db.collection(c).countDocuments(filter as object);
      expect([c, n]).toEqual([c, c === "account" ? 1 : 0]);
    }
    expect((await thoughtsRoute.GET(apiRequest("/api/thoughts", { cookie: a.cookie }))).status).toBe(401);
    expect((await signIn("leaving@example.com")).status).toBe(401);
    expect(await t.db.collection("thoughts").countDocuments({ userId: b.userId })).toBe(1);
  });
});

describe("rate limiting", () => {
  afterEach(() => {
    process.env.AUTH_RATE_LIMIT = "off";
    resetAuthForTests();
  });

  it("limits repeated sign-in attempts from one address", async () => {
    await signUp("limited@example.com");
    process.env.AUTH_RATE_LIMIT = "on";
    resetAuthForTests();
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      statuses.push((await callAuth("/sign-in/email", { email: "limited@example.com", password: "wrong password here" }, { ip: "203.0.113.7" })).status);
    }
    expect(statuses.slice(0, 5).every((s) => s === 401)).toBe(true);
    expect(statuses.slice(5)).toContain(429);
  });
});

describe("production safety", () => {
  it("refuses to run without required configuration, naming only the missing variables", () => {
    expect(() => getConfig({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toThrow(ConfigError);
    try {
      getConfig({ NODE_ENV: "production", BETTER_AUTH_SECRET: "short" } as NodeJS.ProcessEnv);
    } catch (err) {
      expect((err as ConfigError).missing).toEqual([
        "BETTER_AUTH_SECRET (32+ characters)",
        "BETTER_AUTH_URL",
        "MONGODB_URI",
      ]);
      expect((err as Error).message).not.toContain("short");
    }
    expect(
      getConfig({
        NODE_ENV: "production",
        BETTER_AUTH_SECRET: "x".repeat(40),
        BETTER_AUTH_URL: "https://orchard.example",
        MONGODB_URI: "mongodb://db.example/orchard",
      } as NodeJS.ProcessEnv).isProduction
    ).toBe(true);
  });

  it("requires an email provider before email verification can be required", () => {
    expect(() =>
      getConfig({ NODE_ENV: "development", REQUIRE_EMAIL_VERIFICATION: "true" } as NodeJS.ProcessEnv)
    ).toThrow(/RESEND_API_KEY/);
  });

  it("uses Secure session cookies in production and disables development routes", async () => {
    const saved = { ...process.env };
    try {
      Object.assign(process.env, {
        NODE_ENV: "production",
        BETTER_AUTH_SECRET: "p".repeat(40),
        BETTER_AUTH_URL: "http://localhost:3000",
        MONGODB_URI: "mongodb://unused-in-test",
      });
      resetAuthForTests();
      const { res, cookie } = await signUp("prod@example.com");
      const setCookie = res.headers.getSetCookie().find((c) => c.includes("session_token="))!;
      expect(setCookie).toMatch(/; Secure/i);
      expect(setCookie).toMatch(/__Secure-/);

      expect((await seedRoute.POST(apiRequest("/api/dev/seed", { body: {}, cookie }))).status).toBe(404);
      expect((await clockRoute.POST(apiRequest("/api/dev/clock", { body: { offsetDays: 5 }, cookie }))).status).toBe(404);
      expect((await clockRoute.GET(apiRequest("/api/dev/clock", { cookie }))).status).toBe(404);
    } finally {
      for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k];
      Object.assign(process.env, saved);
      resetAuthForTests();
    }
  });
});
