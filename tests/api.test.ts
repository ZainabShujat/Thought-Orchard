import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as thoughtsRoute from "@/app/api/thoughts/route";
import * as thoughtRoute from "@/app/api/thoughts/[id]/route";
import * as careRoute from "@/app/api/thoughts/[id]/care/route";
import type { Thought } from "@/types/thought";
import { TestDb, apiRequest, clearDb, ctx, key, signUp, startTestDb, stopTestDb } from "./support/testServer";

let t: TestDb;
let cookie: string;

beforeAll(async () => {
  t = await startTestDb();
});

afterAll(async () => {
  await stopTestDb(t);
});

beforeEach(async () => {
  await clearDb(t.db);
  cookie = (await signUp(`user-${Date.now()}@example.com`)).cookie;
});

async function plant(content: string, idempotencyKey = key(), as = cookie): Promise<{ status: number; thought: Thought }> {
  const res = await thoughtsRoute.POST(apiRequest("/api/thoughts", { body: { content, idempotencyKey }, cookie: as }));
  return { status: res.status, thought: (await res.json()).thought };
}

async function list(as = cookie): Promise<Thought[]> {
  return (await (await thoughtsRoute.GET(apiRequest("/api/thoughts", { cookie: as }))).json()).thoughts;
}

const water = (id: string, idempotencyKey = key(), as = cookie) =>
  careRoute.POST(apiRequest(`/api/thoughts/${id}/care`, { body: { type: "water", idempotencyKey }, cookie: as }), ctx(id));

describe("thought lifecycle API (spec 10)", () => {
  it("plants, lists and reads a thought", async () => {
    const { status, thought } = await plant("  What if ideas were places?  ");
    expect(status).toBe(201);
    expect(thought.content).toBe("What if ideas were places?");
    expect(thought.position).toEqual({ x: 0, z: 0 });
    expect(thought.regionId).toBe("grove");
    expect(thought.growth?.stage).toBe("new-thought");

    expect((await list()).map((t) => t._id)).toEqual([thought._id]);
    const got = await (await thoughtRoute.GET(apiRequest(`/api/thoughts/${thought._id}`, { cookie }), ctx(thought._id))).json();
    expect(got.thought.content).toBe(thought.content);
  });

  it("marks private responses as not cacheable", async () => {
    const res = await thoughtsRoute.GET(apiRequest("/api/thoughts", { cookie }));
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("a retried plant with the same key returns the original and plants nothing new", async () => {
    const first = await plant("Once", "same-key-123");
    const again = await plant("Once", "same-key-123");
    expect(again.status).toBe(200);
    expect(again.thought._id).toBe(first.thought._id);
    expect(await list()).toHaveLength(1);
  });

  it("rejects empty, oversized and malformed input", async () => {
    const post = (body: unknown) => thoughtsRoute.POST(apiRequest("/api/thoughts", { body, cookie }));
    expect((await post({ content: "   ", idempotencyKey: key() })).status).toBe(400);
    expect((await post({ content: "x".repeat(2001), idempotencyKey: key() })).status).toBe(400);
    expect((await post({ content: "ok", idempotencyKey: key(), userId: "someone-else" })).status).toBe(400);
    const huge = new Request("http://localhost:3000/api/thoughts", {
      method: "POST",
      headers: { cookie },
      body: "x".repeat(20_000),
    });
    expect((await thoughtsRoute.POST(huge)).status).toBe(413);
  });

  it("editing changes content and updatedAt only", async () => {
    const { thought } = await plant("Draft");
    const res = await thoughtRoute.PATCH(
      apiRequest(`/api/thoughts/${thought._id}`, { method: "PATCH", body: { content: "Revised" }, cookie }),
      ctx(thought._id)
    );
    const edited: Thought = (await res.json()).thought;
    expect(edited.content).toBe("Revised");
    expect(edited._id).toBe(thought._id);
    expect(edited.createdAt).toBe(thought.createdAt);
    expect(edited.position).toEqual(thought.position);
    expect(edited.regionId).toBe(thought.regionId);
  });

  it("refuses to let a client overwrite system-managed fields", async () => {
    const { thought } = await plant("Draft");
    const res = await thoughtRoute.PATCH(
      apiRequest(`/api/thoughts/${thought._id}`, {
        method: "PATCH",
        body: { content: "x", createdAt: "2000-01-01", position: { x: 9, z: 9 } },
        cookie,
      }),
      ctx(thought._id)
    );
    expect(res.status).toBe(400);
  });

  it("concurrent plantings never overlap", async () => {
    await Promise.all(Array.from({ length: 12 }, (_, i) => plant(`Thought ${i}`)));
    const positions = (await list()).map((t) => t.position);
    expect(positions).toHaveLength(12);
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        expect(Math.hypot(positions[i].x - positions[j].x, positions[i].z - positions[j].z)).toBeGreaterThanOrEqual(4.8);
      }
    }
  });
});

describe("watering API (spec 5.5)", () => {
  it("records a watering once per idempotency key", async () => {
    const { thought } = await plant("Water me");
    const first = await (await water(thought._id, "water-key-1")).json();
    const retry = await (await water(thought._id, "water-key-1")).json();
    expect(first.counted).toBe(true);
    expect(retry.event._id).toBe(first.event._id);
    expect((await list())[0].care).toHaveLength(1);
  });

  it("a second watering inside the window is recorded but not counted", async () => {
    const { thought } = await plant("Water me twice");
    await water(thought._id);
    const second = await (await water(thought._id)).json();
    expect(second.counted).toBe(false);
    const [t] = await list();
    expect(t.care).toHaveLength(2);
    expect(t.growth?.countedWaterings).toBe(1);
  });

  it("rejects a key reused for a different tree", async () => {
    const a = await plant("A");
    const b = await plant("B");
    await water(a.thought._id, "shared-key-9");
    expect((await water(b.thought._id, "shared-key-9")).status).toBe(409);
  });
});

describe("deletion API (spec 3.4)", () => {
  it("permanently removes the thought and its care, is retry-safe, and moves no other tree", async () => {
    const a = await plant("Keep A");
    const b = await plant("Remove B");
    const c = await plant("Keep C");
    await water(b.thought._id);
    const before = (await list()).filter((t) => t._id !== b.thought._id).map((t) => [t._id, t.position]);

    const del = () => thoughtRoute.DELETE(apiRequest(`/api/thoughts/${b.thought._id}`, { method: "DELETE", cookie }), ctx(b.thought._id));
    expect((await del()).status).toBe(204);
    expect((await del()).status).toBe(404);

    const after = (await list()).map((t) => [t._id, t.position]);
    expect(after).toEqual(before);
    expect(await t.db.collection("careEvents").countDocuments({ thoughtId: b.thought._id })).toBe(0);
    expect(after.map(([id]) => id)).toEqual([a.thought._id, c.thought._id]);
  });

  it("a retry cleans up care events left by an interrupted delete", async () => {
    const { thought } = await plant("Interrupted");
    await water(thought._id);
    // Simulate a crash after the thought was removed but before its care was.
    await t.db.collection("thoughts").deleteOne({ _id: thought._id as never });
    const res = await thoughtRoute.DELETE(apiRequest(`/api/thoughts/${thought._id}`, { method: "DELETE", cookie }), ctx(thought._id));
    expect(res.status).toBe(404);
    expect(await t.db.collection("careEvents").countDocuments({ thoughtId: thought._id })).toBe(0);
  });
});
