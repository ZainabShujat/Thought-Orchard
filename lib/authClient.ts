"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Browser client for the Better Auth endpoints at /api/auth (ADR-011).
 * Sessions live in httpOnly cookies; nothing about the session is stored in
 * localStorage.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || undefined,
});

/** A friendly message for an auth error, without revealing which part was wrong. */
export function authErrorMessage(error: { status?: number; message?: string; code?: string } | null | undefined): string {
  if (!error) return "Something went wrong. Please try again.";
  if (error.status === 429) return "Too many attempts. Please wait a minute and try again.";
  if (error.status === 401) return "That email and password don't match an account.";
  if (error.code === "USER_ALREADY_EXISTS" || error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
    return "An account with that email already exists. Try signing in instead.";
  }
  if (error.code === "PASSWORD_TOO_SHORT") return "Use at least 10 characters for your password.";
  if (error.code === "PASSWORD_TOO_LONG") return "Use at most 128 characters for your password.";
  if (error.code === "INVALID_EMAIL") return "That doesn't look like an email address.";
  if (error.code === "INVALID_TOKEN") return "This link has expired or was already used. Ask for a new one.";
  if (error.code === "INVALID_PASSWORD") return "That password isn't right.";
  if (error.status && error.status >= 500) return "The orchard can't be reached right now. Please try again soon.";
  return error.message || "Something went wrong. Please try again.";
}
