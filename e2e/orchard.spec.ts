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

test("the orchard never goes blank: no stray WebGL contexts, and a lost context comes back", async ({ page }) => {
  const errors = trackErrors(page);
  // Count every canvas that gets a WebGL context. Browsers keep only ~16 alive and
  // kill the oldest (the orchard's) beyond that, which turned the page white.
  await page.addInitScript(() => {
    const seen = new WeakSet<HTMLCanvasElement>();
    (window as unknown as { __glCanvases: number }).__glCanvases = 0;
    const original = HTMLCanvasElement.prototype.getContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HTMLCanvasElement.prototype as any).getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      const ctx = (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
      if (ctx && type.startsWith("webgl") && !seen.has(this)) {
        seen.add(this);
        (window as unknown as { __glCanvases: number }).__glCanvases += 1;
      }
      return ctx;
    };
  });
  await register(page, newAccount("Blank"));
  await completeOnboarding(page);
  await waitForOrchard(page);
  await plantThought(page, "A tree to keep in view");
  await page.keyboard.press("Escape");

  // Lots of re-renders: hovering, walking, opening and closing panels.
  const box = (await page.locator("canvas").boundingBox())!;
  for (let i = 0; i < 40; i++) {
    await page.mouse.move(box.x + 50 + ((i * 37) % (box.width - 100)), box.y + 80 + ((i * 53) % (box.height - 160)));
  }
  await page.locator("canvas").click({ position: { x: 10, y: 10 } });
  await page.keyboard.down("w");
  await page.waitForTimeout(1500);
  await page.keyboard.up("w");
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: /View:/ }).click();
    await page.getByRole("button", { name: /More:/ }).click();
    await page.keyboard.press("Escape");
  }
  const contexts = await page.evaluate(() => (window as unknown as { __glCanvases: number }).__glCanvases);
  // One probe (released at once) plus the orchard itself.
  expect(contexts).toBeLessThanOrEqual(2);

  // Simulate the GPU taking the context away: the world must come back by itself.
  const before = await page.locator("canvas").elementHandle();
  await page.evaluate(() => {
    const gl = document.querySelector("canvas")!.getContext("webgl2") as WebGL2RenderingContext;
    gl.getExtension("WEBGL_lose_context")!.loseContext();
  });
  await expect(page.getByRole("status").filter({ hasText: "catching its breath" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "catching its breath" })).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator("canvas")).toBeVisible();
  const after = await page.locator("canvas").elementHandle();
  expect(await page.evaluate(([a, b]) => a !== b, [before, after])).toBe(true);
  // The new scene draws: sample the centre of the canvas, it isn't blank white.
  await page.waitForTimeout(1500);
  const shot = await page.locator("canvas").screenshot();
  expect(shot.length).toBeGreaterThan(5_000);
  expect(errors).toEqual([]);
});
