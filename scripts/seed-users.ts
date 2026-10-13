/**
 * Development seed (README "Sample accounts"): creates the sample accounts in
 * `scripts/sampleUsers.ts` through the real sign-up path, then plants their
 * thoughts through the normal create and water operations. Safe to run again:
 * existing accounts are kept and orchards that already have thoughts are left
 * alone.
 *
 *   npm run db:seed
 *
 * Without MONGODB_URI it uses the local development database in .data/mongo,
 * so stop `npm run dev` first (only one process can open that folder).
 * It refuses to run in production or against a non-local MONGODB_URI.
 */
import { getAuth } from "../server/auth/auth";
import { closeMongo, getDb } from "../server/db/mongo";
import { updateProfile } from "../server/services/accountService";
import { seedSampleOrchard } from "../server/services/devSeed";
import { SAMPLE_USERS } from "./sampleUsers";

function assertLocal() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seeding is development-only; NODE_ENV is production.");
  }
  const uri = process.env.MONGODB_URI;
  if (uri && !/^mongodb:\/\/(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(uri)) {
    throw new Error("MONGODB_URI is not a local database. Sample accounts are only for local development.");
  }
}

async function findUser(email: string): Promise<{ id: string; name: string } | null> {
  const doc = await (await getDb()).collection("user").findOne({ email });
  return doc ? { id: String(doc._id), name: String(doc.name ?? "") } : null;
}

async function main() {
  assertLocal();
  // Server-side sign-ups from one process would otherwise trip the sign-up limit.
  process.env.AUTH_RATE_LIMIT = "off";
  const auth = await getAuth();

  for (const sample of SAMPLE_USERS) {
    let user = await findUser(sample.email);
    const created = !user;
    if (!user) {
      await auth.api.signUpEmail({ body: { name: sample.name, email: sample.email, password: sample.password } });
      user = await findUser(sample.email);
      if (!user) throw new Error(`Sign-up for ${sample.email} did not create an account.`);
    }

    if (sample.onboarded) {
      await updateProfile({ id: user.id, email: sample.email, name: user.name }, { completeOnboarding: true });
    }
    const { planted } = await seedSampleOrchard(user.id, undefined, sample.thoughts);

    const status = created ? "created" : "already existed";
    console.log(`${sample.email}: ${status}; ${planted > 0 ? `planted ${planted} thoughts` : "orchard unchanged"}`);
  }
  console.log("Passwords are in scripts/sampleUsers.ts.");
}

main()
  .catch((err) => {
    console.error("Seeding failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => closeMongo());
