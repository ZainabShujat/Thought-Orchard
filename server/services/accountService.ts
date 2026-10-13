import "server-only";
import type { Db } from "mongodb";
import { getDb } from "@/server/db/mongo";
import { now } from "@/server/clock";
import { collections, ProfileDoc } from "@/server/repositories/collections";
import { getOrCreateOrchard } from "@/server/services/orchardService";
import { isDuplicateKeyError } from "@/server/services/errors";
import { DEFAULT_PREFERENCES, Preferences, Profile } from "@/types/profile";

/**
 * Account data owned by the app (ADR-011): the profile and the private orchard.
 * Better Auth owns the user, session and credential records.
 */

async function database(db?: Db): Promise<Db> {
  return db ?? getDb();
}

/** Called once when a user is created: profile plus their one private orchard (spec 9.3). */
export async function initializeAccount(userId: string, displayName: string, db?: Db): Promise<void> {
  const d = await database(db);
  const at = now();
  try {
    await collections(d).profiles.insertOne({
      _id: userId,
      displayName: displayName.trim().slice(0, 60),
      onboardedAt: null,
      preferences: { ...DEFAULT_PREFERENCES },
      createdAt: at,
      updatedAt: at,
    });
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
  }
  await getOrCreateOrchard(userId, d);
}

async function getOrCreateProfile(userId: string, fallbackName: string, d: Db): Promise<ProfileDoc> {
  const existing = await collections(d).profiles.findOne({ _id: userId });
  if (existing) return existing;
  // Accounts created before profiles existed, or a failed sign-up hook.
  await initializeAccount(userId, fallbackName, d);
  return (await collections(d).profiles.findOne({ _id: userId }))!;
}

export async function getProfile(user: { id: string; email: string; name: string }, db?: Db): Promise<Profile> {
  const d = await database(db);
  const doc = await getOrCreateProfile(user.id, user.name, d);
  return {
    displayName: doc.displayName,
    email: user.email,
    onboarded: doc.onboardedAt !== null,
    preferences: { ...DEFAULT_PREFERENCES, ...doc.preferences },
    createdAt: doc.createdAt.toISOString(),
  };
}

export interface ProfileUpdate {
  displayName?: string;
  preferences?: Partial<Preferences>;
  completeOnboarding?: boolean;
}

export async function updateProfile(
  user: { id: string; email: string; name: string },
  update: ProfileUpdate,
  db?: Db
): Promise<Profile> {
  const d = await database(db);
  const current = await getOrCreateProfile(user.id, user.name, d);
  const set: Partial<ProfileDoc> = { updatedAt: now() };
  if (update.displayName !== undefined) set.displayName = update.displayName.trim();
  if (update.preferences) set.preferences = { ...DEFAULT_PREFERENCES, ...current.preferences, ...update.preferences };
  if (update.completeOnboarding && current.onboardedAt === null) set.onboardedAt = now();
  await collections(d).profiles.updateOne({ _id: user.id }, { $set: set });
  return getProfile(user, d);
}

/**
 * Removes everything the app stores for a user (spec 17.4). Runs before Better
 * Auth deletes the user, sessions and credentials. Care events first, then
 * thoughts, orchard and profile, so a partial failure never leaves visible
 * thoughts without their owner's orchard.
 */
export async function deleteAccountData(userId: string, db?: Db): Promise<void> {
  const d = await database(db);
  const c = collections(d);
  await c.careEvents.deleteMany({ userId });
  await c.thoughts.deleteMany({ userId });
  await c.orchards.deleteMany({ ownerId: userId });
  await c.profiles.deleteOne({ _id: userId });
}
