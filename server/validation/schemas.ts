import { z } from "zod";

/**
 * Request validation (spec 10, 11). Thought length limit is OD-06; 2,000
 * characters is the documented working default until it is decided.
 */
import { MAX_THOUGHT_LENGTH } from "@/server/validation/limits";
export { MAX_BODY_BYTES, MAX_THOUGHT_LENGTH } from "@/server/validation/limits";

const content = z
  .string({ required_error: "Write a thought first." })
  .transform((s) => s.trim())
  .pipe(
    z
      .string()
      .min(1, "Write a thought first.")
      .max(MAX_THOUGHT_LENGTH, `Thoughts can be up to ${MAX_THOUGHT_LENGTH} characters.`)
  );

const idempotencyKey = z.string().min(8).max(100).regex(/^[A-Za-z0-9_-]+$/);

export const createThoughtSchema = z.object({ content, idempotencyKey }).strict();

// `.strict()` rejects system-managed fields like createdAt or position (spec 8.4).
export const editThoughtSchema = z.object({ content }).strict();

export const careSchema = z.object({ type: z.literal("water"), idempotencyKey }).strict();

export const thoughtIdSchema = z.string().uuid();

export const profileUpdateSchema = z
  .object({
    displayName: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1, "Choose a name to show.").max(60, "Names can be up to 60 characters."))
      .optional(),
    preferences: z
      .object({
        plainFont: z.boolean(),
        motion: z.enum(["system", "reduce", "full"]),
        startView: z.enum(["immersive", "explorer"]),
      })
      .partial()
      .strict()
      .optional(),
    completeOnboarding: z.literal(true).optional(),
  })
  .strict();
