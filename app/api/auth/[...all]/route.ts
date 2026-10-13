import { getAuth } from "@/server/auth/auth";
import { ConfigError } from "@/server/config";
import { errorResponse } from "@/server/http";

export const dynamic = "force-dynamic";

/** Better Auth endpoints: sign-up, sign-in, sign-out, session, password, account deletion (ADR-011). */
async function handler(request: Request): Promise<Response> {
  try {
    const auth = await getAuth();
    return await auth.handler(request);
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error("[auth] Not configured:", err.missing.join(", "));
      return errorResponse(503, "not_configured", "Sign-in isn't available right now.");
    }
    console.error("[auth] Unexpected error:", err instanceof Error ? err.message : "unknown");
    return errorResponse(500, "server_error", "Something went wrong. Please try again.");
  }
}

export const GET = handler;
export const POST = handler;
