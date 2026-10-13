import "server-only";

/** An error with an HTTP status and a message safe to show the user (spec 10). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export const notFound = () => new ApiError(404, "not_found", "That thought couldn't be found.");

export function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}
