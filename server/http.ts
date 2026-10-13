import "server-only";
import { ZodError, ZodSchema } from "zod";
import { ApiError } from "@/server/services/errors";
import { UnauthenticatedError } from "@/server/auth/currentUser";
import { ConfigError } from "@/server/config";
import { MAX_BODY_BYTES } from "@/server/validation/limits";

/** Consistent JSON errors (spec 10). Never exposes stack traces, secrets or private data. */
export function errorResponse(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status, headers: { "cache-control": "no-store" } });
}

export async function readJson<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) throw new ApiError(413, "too_large", "That request is too large.");
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new ApiError(413, "too_large", "That request is too large.");
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new ApiError(400, "invalid_json", "The request couldn't be read.");
  }
  return schema.parse(body);
}

/** JSON response for private data: never cached by browsers or proxies. */
export function privateJson(body: unknown, init: ResponseInit = {}): Response {
  return Response.json(body, { ...init, headers: { "cache-control": "no-store", ...init.headers } });
}

export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) return errorResponse(err.status, err.code, err.message);
    if (err instanceof ZodError) {
      return errorResponse(400, "invalid_input", err.issues[0]?.message ?? "That input isn't valid.");
    }
    if (err instanceof UnauthenticatedError) return errorResponse(401, "unauthenticated", "Please sign in.");
    if (err instanceof ConfigError) {
      // Names of missing variables only, never values.
      console.error("[api] Not configured:", err.missing.join(", "));
      return errorResponse(503, "not_configured", "The orchard isn't available right now.");
    }
    // Log the failure without request bodies, so private thought text never reaches logs (spec 11).
    console.error("[api] Unexpected error:", err instanceof Error ? err.message : "unknown");
    return errorResponse(500, "server_error", "Something went wrong. Please try again.");
  }
}
