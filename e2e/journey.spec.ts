import { expect, test } from "@playwright/test";
import { completeOnboarding, logOut, newAccount, plantThought, register, signIn, trackErrors, waitForOrchard } from "./helpers";

/**
 * The complete user journey: landing → register → onboarding → orchard →
 * plant → Notebook / Map / Settings → read, edit, water, delete → leave and
 * sign back in → log out and lose access.
 */
test("a new visitor's whole journey, with data intact across sessions", async ({ page }) => {
  const errors = trackErrors(page);
  const account = newAccount("Journey");
  const first = `Journey thought ${Date.now()}`;
  const edited = `${first} (edited)`;

  // 1. Landing page.
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Thought Orchard" })).toBeVisible();
  await page.getByRole("link", { name: "Enter forest" }).click();
  await page.waitForURL("**/register");

  // 2. Register, with validation feedback first.
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Tell us what to call you.")).toBeVisible();
  await register(page, account);

  // 3. Onboarding, saving a display name and a preference.
  await completeOnboarding(page, { displayName: "Zee", plainFont: true });

  // 4. Personal orchard initialised and empty.
  await waitForOrchard(page);
  await expect(page.getByRole("heading", { name: "Zee's orchard" })).toBeVisible();
  await expect(page.getByText("Your orchard is waiting.")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-font", "plain");

  // 5. Plant a thought and see its tree.
  const panel = await plantThought(page, first);
  await expect(page.getByText("1 tree")).toBeVisible();
  await expect(panel).toContainText("stage 1 of 7");

  // Read and edit in the orchard.
  await panel.getByRole("button", { name: "Edit" }).click();
  await panel.getByLabel("Edit your thought").fill(edited);
  await panel.getByRole("button", { name: "Save" }).click();
  await expect(panel).toContainText(edited);

  // Water in the orchard.
  await panel.getByRole("button", { name: "Water" }).click();
  await expect(panel).toContainText("Last watered");

  // 6. Navigate: Notebook.
  await page.getByRole("link", { name: "Notebook" }).click();
  await page.waitForURL("**/notebook");
  const entry = page.getByRole("listitem").filter({ hasText: edited });
  await expect(entry).toBeVisible();
  await expect(entry).toContainText("New Thought");

  // Search.
  await page.getByLabel("Search your thoughts").fill("no such words");
  await expect(page.getByText("0 of 1 thoughts match")).toBeVisible();
  await page.getByLabel("Search your thoughts").fill("journey");
  await expect(entry).toBeVisible();

  // Map: the same tree from the same world data.
  await page.getByRole("link", { name: "Map" }).click();
  await page.waitForURL("**/map");
  await expect(page.getByText("1 tree · tap one to visit it")).toBeVisible();
  const marker = page.locator('a[href^="/orchard?tree="]').first();
  await expect(marker).toHaveAttribute("aria-label", new RegExp(`Visit tree\\. New Thought: ${first.slice(0, 20)}`));

  // Visit the tree from the map.
  await marker.click();
  await page.waitForURL("**/orchard*");
  await waitForOrchard(page);
  await expect(page.getByRole("dialog", { name: /New Thought/ })).toContainText(edited);

  // Settings: change the name.
  await page.goto("/settings");
  await page.getByLabel("What the orchard calls you").fill("Zainab");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved." })).toBeVisible();

  // 8. Leave and sign back in: everything is still there.
  await page.goto("/orchard");
  await waitForOrchard(page);
  await logOut(page);
  await signIn(page, account);
  await waitForOrchard(page);
  await expect(page.getByRole("heading", { name: "Zainab's orchard" })).toBeVisible();
  await page.goto("/notebook");
  const again = page.getByRole("listitem").filter({ hasText: edited });
  await again.getByRole("button", { name: "Tend" }).click();
  await expect(again).toContainText("Last watered");

  // 7. Delete with the two-step confirmation.
  await again.getByRole("button", { name: "Delete" }).click();
  await expect(again).toContainText("Remove this thought and its tree?");
  await again.getByRole("button", { name: "Remove permanently" }).click();
  await expect(page.getByText("Nothing planted yet.")).toBeVisible();

  // 9. Log out: protected pages and data are no longer reachable.
  await page.goto("/settings");
  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL((url) => url.pathname === "/");
  await page.goto("/notebook");
  await page.waitForURL("**/login");
  const api = await page.request.get("/api/thoughts");
  expect(api.status()).toBe(401);

  expect(errors).toEqual([]);
});

test("account deletion needs the password, then removes access and data", async ({ page }) => {
  const account = newAccount("Leaving");
  await register(page, account);
  await completeOnboarding(page);
  await waitForOrchard(page);
  await plantThought(page, "Soon gone");

  await page.goto("/settings");
  await page.getByRole("button", { name: "Delete my account…" }).click();
  await page.getByLabel("Password", { exact: true }).fill("wrong password value");
  await page.getByRole("button", { name: "Delete everything permanently" }).click();
  await expect(page.getByText("That password isn't right.")).toBeVisible();

  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Delete everything permanently" }).click();
  await page.waitForURL("**/login?deleted=1");
  await expect(page.getByText("Your account and everything in it were deleted.")).toBeVisible();

  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("That email and password don't match an account.")).toBeVisible();
});
