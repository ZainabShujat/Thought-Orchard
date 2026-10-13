import { expect, test } from "@playwright/test";
import { trackErrors } from "./helpers";

/** Landing page scenes for comparison with references 07 (desktop) and 08 (mobile). */
for (const vp of [
  { name: "desktop-1536", width: 1536, height: 1024 },
  { name: "mobile-390", width: 390, height: 844 },
]) {
  test(`landing page at ${vp.name}`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Thought\s*Orchard/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Enter forest" })).toBeVisible();
    await expect(page.getByRole("link", { name: "View map" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
    await expect(page.locator("canvas")).toBeVisible({ timeout: 45_000 });
    await page.waitForTimeout(5000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `test-results/screens/landing-${vp.name}.png` });
    expect(errors).toEqual([]);
  });
}
