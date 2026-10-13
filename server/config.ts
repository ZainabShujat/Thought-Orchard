import "server-only";

/**
 * Server configuration from environment variables (see `.env.example` and
 * README "Deployment"). Production fails safely: if anything required is
 * missing, `getConfig()` throws a ConfigError naming the missing variables
 * (never their values) and the API answers 503 instead of running half-set-up.
 */

export class ConfigError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Missing or invalid configuration: ${missing.join(", ")}`);
  }
}

export interface EmailConfig {
  provider: "resend";
  apiKey: string;
  from: string;
}

export interface ServerConfig {
  isProduction: boolean;
  mongodbUri: string | undefined;
  mongodbDb: string;
  /** MongoDB transactions need a replica set (Atlas has one; a standalone server does not). */
  mongodbTransactions: boolean;
  authSecret: string;
  authUrl: string;
  trustedOrigins: string[];
  rateLimitEnabled: boolean;
  email: EmailConfig | null;
  requireEmailVerification: boolean;
}

const DEV_SECRET = "development-only-secret-do-not-use-in-production-0000";
let warned = false;

export function getConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const isProduction = env.NODE_ENV === "production";
  const missing: string[] = [];

  const secret = env.BETTER_AUTH_SECRET;
  if (isProduction && (!secret || secret.length < 32)) missing.push("BETTER_AUTH_SECRET (32+ characters)");
  if (isProduction && !env.BETTER_AUTH_URL) missing.push("BETTER_AUTH_URL");
  if (isProduction && !env.MONGODB_URI) missing.push("MONGODB_URI");

  const email: EmailConfig | null =
    env.RESEND_API_KEY && env.EMAIL_FROM ? { provider: "resend", apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM } : null;
  const requireEmailVerification = env.REQUIRE_EMAIL_VERIFICATION === "true";
  if (requireEmailVerification && !email) missing.push("RESEND_API_KEY and EMAIL_FROM (required by REQUIRE_EMAIL_VERIFICATION)");

  if (missing.length > 0) throw new ConfigError(missing);

  if (!isProduction && !secret && !warned) {
    warned = true;
    console.warn("[config] BETTER_AUTH_SECRET is not set; using a development-only secret.");
  }

  const authUrl = env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return {
    isProduction,
    mongodbUri: env.MONGODB_URI,
    mongodbDb: env.MONGODB_DB ?? "thought_orchard",
    mongodbTransactions: env.MONGODB_TRANSACTIONS === "true",
    authSecret: secret ?? DEV_SECRET,
    authUrl,
    trustedOrigins: [authUrl, ...(env.TRUSTED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean)],
    rateLimitEnabled: env.AUTH_RATE_LIMIT !== "off",
    email,
    requireEmailVerification,
  };
}

/** True when password reset emails can actually be sent (or, in development, logged). */
export function passwordResetAvailable(config: ServerConfig = getConfig()): boolean {
  return Boolean(config.email) || !config.isProduction;
}
