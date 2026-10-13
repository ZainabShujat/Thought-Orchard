import { expect, test } from "@playwright/test";
import { completeOnboarding, newAccount, plantThought, register, waitForOrchard } from "./helpers";

/**
 * Layout at the four required widths: no horizontal scrolling, core controls
 * visible, screenshots saved for visual review in test-results/screens.
 */
const VIEWPORTS = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1366", width: 1366, height: 768 },
  { name: "wide-1920", width: 1920, height: 1080 },
];

test("every page fits each viewport", async ({ page }) => {
  test.setTimeout(300_000);
  await register(page, newAccount("Sizes"));
  await completeOnboarding(page);
  await waitForOrchard(page);
  await plantThought(page, "A thought to see at every size");

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const path of ["/", "/orchard", "/notebook", "/map", "/settings", "/support"]) {
      await page.goto(path);
      if (path === "/orchard") await waitForOrchard(page);
      else await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} at ${vp.name} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(1);
      await page.screenshot({ path: `test-results/screens/${vp.name}${path === "/" ? "-landing" : path.replace("/", "-")}.png` });
    }
    // The orchard toolbar's five actions are all on screen.
    await page.goto("/orchard");
    await waitForOrchard(page);
    for (const name of ["Notebook", "Map"]) {
      await expect(page.getByRole("navigation", { name: "Orchard actions" }).getByRole("link", { name })).toBeInViewport();
    }
    for (const name of [/^Plant$/, /View:/, /More:/]) {
      await expect(page.getByRole("navigation", { name: "Orchard actions" }).getByRole("button", { name })).toBeInViewport();
    }
  }

  // Signed-out pages too.
  await page.context().clearCookies();
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const path of ["/login", "/register"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} at ${vp.name}`).toBeLessThanOrEqual(1);
      await page.screenshot({ path: `test-results/screens/${vp.name}${path.replace("/", "-")}.png` });
    }
  }
});
