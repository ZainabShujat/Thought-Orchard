import "server-only";
import { randomUUID } from "node:crypto";
import type { Db } from "mongodb";
import { getDb } from "@/server/db/mongo";
import { now } from "@/server/clock";
import { collections } from "@/server/repositories/collections";
import { createThought, getOrCreateOrchard, waterThought } from "@/server/services/orchardService";
import { SAMPLE_THOUGHTS, SampleThought } from "@/features/thoughts/sampleThoughts";
import { DAY_MS } from "@/features/growth/growthModel";

/**
 * Development only: plants the sample thoughts through the normal create and
 * water operations, with times in the past, so every growth stage can be
 * reviewed (spec 20.9). Does nothing if the orchard already has thoughts.
 */
export async function seedSampleOrchard(
  userId: string,
  db?: Db,
  samples: SampleThought[] = SAMPLE_THOUGHTS
): Promise<{ planted: number }> {
  if (process.env.NODE_ENV === "production") throw new Error("Seeding is development-only");
  const d = db ?? (await getDb());
  const orchard = await getOrCreateOrchard(userId, d);
  const existing = await collections(d).thoughts.countDocuments({ orchardId: orchard._id });
  if (existing > 0) return { planted: 0 };

  const nowMs = now().getTime();
  for (const sample of samples) {
    const { thought } = await createThought(
      userId,
      { content: sample.content, idempotencyKey: `seed-${randomUUID()}` },
      d,
      { plantedAt: new Date(nowMs - sample.plantedDaysAgo * DAY_MS) }
    );
    for (const daysAgo of sample.wateredDaysAgo) {
      await waterThought(userId, thought._id, `seed-${randomUUID()}`, d, {
        at: new Date(nowMs - daysAgo * DAY_MS),
      });
    }
  }
  return { planted: samples.length };
}
