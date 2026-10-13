import type { Thought } from "@/types/thought";
import type { CareType, GrowthState } from "@/features/growth/growthModel";

/**
 * Client for the orchard API (spec 10). The base URL is configurable so the
 * mobile app can point at a deployed server (spec 17.3); on the web it is the
 * same origin.
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export class ApiFailure extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiFailure(0, "offline", "Couldn't reach your orchard. Check your connection.");
  }
  if (res.status === 204) return undefined as T;
  if (res.status === 401 && typeof window !== "undefined") {
    // Session expired or signed out elsewhere.
    window.location.assign("/login?expired=1");
    throw new ApiFailure(401, "unauthenticated", "Please sign in again.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiFailure(
      res.status,
      body?.error?.code ?? "error",
      body?.error?.message ?? "Something went wrong. Please try again."
    );
  }
  return body as T;
}

export function newRequestKey(): string {
  return crypto.randomUUID();
}

export function listThoughts(): Promise<{ thoughts: Thought[]; serverNow: string }> {
  return request("/api/thoughts", { cache: "no-store" });
}

export async function plantThought(content: string, idempotencyKey: string): Promise<Thought> {
  return (await request<{ thought: Thought }>("/api/thoughts", {
    method: "POST",
    body: JSON.stringify({ content, idempotencyKey }),
  })).thought;
}

export async function editThought(id: string, content: string): Promise<Thought> {
  return (await request<{ thought: Thought }>(`/api/thoughts/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  })).thought;
}

/** Permanent. A 404 means it is already gone (for example after a retry), which counts as done. */
export async function deleteThought(id: string): Promise<void> {
  try {
    await request<void>(`/api/thoughts/${id}`, { method: "DELETE" });
  } catch (err) {
    if (err instanceof ApiFailure && err.status === 404) return;
    throw err;
  }
}

export interface CareResponse {
  event: { _id: string; type: CareType; createdAt: string };
  counted: boolean;
  growth: GrowthState;
  stageChanged: boolean;
  /** A watering that brought a weakened tree back; it lost a stage. */
  revived: boolean;
  serverNow: string;
}

export function careForThought(id: string, type: CareType, idempotencyKey: string): Promise<CareResponse> {
  return request(`/api/thoughts/${id}/care`, {
    method: "POST",
    body: JSON.stringify({ type, idempotencyKey }),
  });
}
