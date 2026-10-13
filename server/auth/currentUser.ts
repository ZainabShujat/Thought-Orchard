import "server-only";
import { getAuth } from "@/server/auth/auth";

/**
 * Resolves the signed-in user from the session cookie, on the server only
 * (spec 10, 11; ADR-011). The client never supplies a user ID. A missing,
 * invalid or expired session is unauthenticated.
 */
export class UnauthenticatedError extends Error {}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export async function getSessionUser(headers: Headers): Promise<SessionUser | null> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  return { id: session.user.id, email: session.user.email, name: session.user.name };
}

export async function requireUser(request: Request): Promise<SessionUser> {
  const user = await getSessionUser(request.headers);
  if (!user) throw new UnauthenticatedError("Not signed in");
  return user;
}

export async function currentUserId(request: Request): Promise<string> {
  return (await requireUser(request)).id;
}
