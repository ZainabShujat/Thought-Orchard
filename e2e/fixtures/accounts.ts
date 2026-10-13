/**
 * Test accounts for local development checks and end-to-end tests only.
 * They exist only in local or throwaway test databases, never in production.
 */
export const DEV_REVIEW_ACCOUNT = {
  name: "Review Gardener",
  email: "review.gardener@example.test",
  password: "orchard-review-2026-local",
};

/** End-to-end tests create fresh accounts per run with these passwords. */
export const E2E_PASSWORD = "e2e-orchard-password-0001";
