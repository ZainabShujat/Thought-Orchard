import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getConfig } from "@/server/config";
import { getMongo } from "@/server/db/mongo";
import { sendEmail } from "@/server/email/mailer";
import { deleteAccountData, initializeAccount } from "@/server/services/accountService";

/**
 * Authentication (ADR-011): Better Auth with email and password, sessions in
 * MongoDB, secure cookies in production, and rate limits on sign-in, sign-up
 * and password reset. Built lazily because the database connects lazily.
 */

export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 128;
const SESSION_DAYS = 30;

async function createAuth() {
  const config = getConfig();
  const { db, client } = await getMongo();

  return betterAuth({
    appName: "Thought Orchard",
    secret: config.authSecret,
    baseURL: config.authUrl,
    trustedOrigins: config.trustedOrigins,
    database: mongodbAdapter(db, { client, transaction: config.mongodbTransactions }),

    emailAndPassword: {
      enabled: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      maxPasswordLength: MAX_PASSWORD_LENGTH,
      autoSignIn: !config.requireEmailVerification,
      requireEmailVerification: config.requireEmailVerification,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 60 * 60,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "Reset your Thought Orchard password",
          text: `Someone asked to reset the password for your Thought Orchard account. If it was you, open this link within an hour:\n\n${url}\n\nIf it wasn't you, you can ignore this email.`,
        });
      },
    },

    emailVerification: config.email
      ? {
          sendOnSignUp: config.requireEmailVerification,
          autoSignInAfterVerification: true,
          sendVerificationEmail: async ({ user, url }) => {
            await sendEmail({
              to: user.email,
              subject: "Confirm your email for Thought Orchard",
              text: `Open this link to confirm your email:\n\n${url}`,
            });
          },
        }
      : undefined,

    session: {
      expiresIn: SESSION_DAYS * 24 * 60 * 60,
      updateAge: 24 * 60 * 60,
    },

    user: {
      deleteUser: {
        enabled: true,
        // Remove the orchard, thoughts, care events and profile first (spec 17.4).
        beforeDelete: async (user) => {
          await deleteAccountData(user.id, db);
        },
      },
    },

    databaseHooks: {
      user: {
        create: {
          // Every new account gets a profile and one private orchard (spec 9.3).
          after: async (user) => {
            await initializeAccount(user.id, user.name ?? "", db);
          },
        },
      },
    },

    rateLimit: {
      enabled: config.rateLimitEnabled,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 5 },
        "/request-password-reset": { window: 300, max: 3 },
        "/forget-password": { window: 300, max: 3 },
        "/change-password": { window: 60, max: 5 },
        "/delete-user": { window: 60, max: 5 },
      },
    },

    advanced: {
      useSecureCookies: config.isProduction,
      ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"] },
    },
  });
}

export type Auth = Awaited<ReturnType<typeof createAuth>>;

const holder = globalThis as unknown as { __orchardAuth?: Promise<Auth> };

export function getAuth(): Promise<Auth> {
  if (!holder.__orchardAuth) {
    holder.__orchardAuth = createAuth().catch((err) => {
      holder.__orchardAuth = undefined;
      throw err;
    });
  }
  return holder.__orchardAuth;
}

/** Test hook: rebuild auth after switching databases or configuration. */
export function resetAuthForTests(): void {
  holder.__orchardAuth = undefined;
}
