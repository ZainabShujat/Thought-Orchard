import { expect, test } from "@playwright/test";
import { completeOnboarding, newAccount, plantThought, register, trackErrors, waitForOrchard } from "./helpers";

/**
 * Captures the orchard scenes the visual review (spec 20.9) needs, at phone
 * and desktop sizes: a tree open beside the letter panel in both views, and
 * the forest edge. Saved to test-results/screens for review; the only
 * assertions are that the scenes render without errors and the panel opens.
 */
test("orchard scenes for visual review", async ({ page }) => {
  test.setTimeout(240_000);
  const errors = trackErrors(page);
  await register(page, newAccount("Scenes"));
  await completeOnboarding(page);
  await waitForOrchard(page);
  await plantThought(page, "A small new thought, framed beside the letter");
  await page.waitForTimeout(1500);

  for (const vp of [
    { name: "mobile-375", width: 375, height: 812 },
    { name: "desktop-1366", width: 1366, height: 768 },
  ]) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/notebook");
    await page.getByRole("link", { name: "Visit tree" }).first().click();
    await waitForOrchard(page);
    await expect(page.getByRole("dialog", { name: /New Thought/ })).toBeVisible();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `test-results/screens/review-${vp.name}-immersive-panel.png` });

    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /More:/ }).click();
    await page.getByRole("button", { name: "Back to the path" }).click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `test-results/screens/review-${vp.name}-immersive-entrance.png` });

    await page.getByRole("button", { name: /View: switch to Explorer/ }).click();
    // Software WebGL in headless runs is slow; let the stepped camera move finish.
    await page.waitForTimeout(6000);
    await page.screenshot({ path: `test-results/screens/review-${vp.name}-explorer.png` });
    await page.getByRole("button", { name: /View: switch to Immersive/ }).click();
  }
  expect(errors).toEqual([]);
});
