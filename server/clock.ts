import "server-only";

/**
 * Server time. All growth and care timestamps come from here (spec 4.2).
 *
 * In development only, the clock can be moved forward to review growth
 * without waiting (spec 20.9, step 7). Production always uses real time.
 */
const state = globalThis as unknown as { __orchardClockOffsetMs?: number };

export function now(): Date {
  const offset = process.env.NODE_ENV === "production" ? 0 : state.__orchardClockOffsetMs ?? 0;
  return new Date(Date.now() + offset);
}

export function setDevClockOffsetDays(days: number): void {
  if (process.env.NODE_ENV === "production") throw new Error("Clock offset is development-only");
  state.__orchardClockOffsetMs = Math.round(days * 86_400_000);
}

export function getDevClockOffsetDays(): number {
  return (state.__orchardClockOffsetMs ?? 0) / 86_400_000;
}
