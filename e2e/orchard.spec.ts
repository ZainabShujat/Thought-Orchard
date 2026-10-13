import { expect, test } from "@playwright/test";
import { completeOnboarding, newAccount, plantThought, register, trackErrors, waitForOrchard } from "./helpers";

test("the 3D orchard renders, switches views, and keeps your place across pages", async ({ page }) => {
  const errors = trackErrors(page);
  await register(page, newAccount("Views"));
  await completeOnboarding(page);
  await waitForOrchard(page);
  await plantThought(page, "A tree to stand beside");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /View: switch to Explorer/ }).click();
  await expect(page.getByText(/· Explorer/)).toBeVisible();

  // Walk a little with the keyboard, then leave for the Notebook and come back.
  await page.locator("canvas").click({ position: { x: 10, y: 10 } });
  await page.keyboard.down("w");
  await page.waitForTimeout(800);
  await page.keyboard.up("w");
  await page.getByRole("link", { name: "Notebook" }).click();
  await page.waitForURL("**/notebook");
  await page.getByRole("link", { name: "Orchard" }).click();
  await waitForOrchard(page);
  // The view you left in is restored for this tab.
  await expect(page.getByText(/· Explorer/)).toBeVisible();

  await page.getByRole("button", { name: /View: switch to Immersive/ }).click();
  await expect(page.getByText(/· Immersive/)).toBeVisible();
  await page.getByRole("button", { name: /More:/ }).click();
  await page.getByRole("button", { name: "Back to the path" }).click();

  expect(errors).toEqual([]);
});

test("reduced motion: from the device, or from the account setting", async ({ page }) => {
  const errors = trackErrors(page);
  const longText = "A longer thought that would normally type itself out a few letters at a time.";

  // Device setting: the letter shows its whole text at once.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await register(page, newAccount("Calm"));
  await completeOnboarding(page);
  await waitForOrchard(page);
  const panel = await plantThought(page, longText);
  await expect(panel.locator("p[aria-hidden='true']")).toHaveText(longText, { timeout: 500 });

  // Account setting overrides the device: "Reduce motion" with a full-motion device.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/settings");
  await page.getByLabel("Reduce motion").check();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved." })).toBeVisible();
  await page.goto("/notebook");
  await page.getByRole("link", { name: "Visit tree" }).first().click();
  await waitForOrchard(page);
  const again = page.getByRole("dialog", { name: /New Thought/ });
  await expect(again.locator("p[aria-hidden='true']")).toHaveText(longText, { timeout: 500 });

  expect(errors).toEqual([]);
});

test("keyboard: the plant sheet traps focus and Escape closes it", async ({ page }) => {
  await register(page, newAccount("Keys"));
  await completeOnboarding(page);
  await waitForOrchard(page);

  await page.getByRole("button", { name: "Plant", exact: true }).click();
  await expect(page.getByLabel("Your thought")).toBeFocused();
  for (let i = 0; i < 6; i++) await page.keyboard.press("Tab");
  const insideDialog = await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
  expect(insideDialog).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Plant a thought" })).toHaveCount(0);
});
