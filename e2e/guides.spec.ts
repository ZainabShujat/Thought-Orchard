import { expect, test } from "@playwright/test";
import { completeOnboarding, newAccount, register, trackErrors, waitForOrchard } from "./helpers";

test("About, How to use and All pages are public and reachable from the home screen", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  const guides = page.getByRole("navigation", { name: "Guides" });
  for (const [link, heading] of [
    ["About", "About"],
    ["How to use", "How to use"],
    ["All pages", "All pages"],
  ]) {
    await page.goto("/");
    await guides.getByRole("link", { name: link }).click();
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  }
  // Signed out, All pages offers Log in and Sign up, not the orchard pages.
  await expect(page.getByRole("link", { name: /Log in/ }).last()).toBeVisible();
  await expect(page.getByRole("link", { name: /^Notebook/ })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("the ⋯ menu lists every page on the home screen and in the app's top bar", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Menu: all pages" }).click();
  const menu = page.getByRole("dialog", { name: "All pages" });
  for (const name of ["Home", "About", "How to use", "All pages", "Support", "Log in", "Sign up"]) {
    await expect(menu.getByRole("link", { name, exact: true })).toBeVisible();
  }
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);

  await register(page, newAccount("Guides"));
  await completeOnboarding(page);
  await waitForOrchard(page);
  await page.goto("/notebook");
  await page.getByRole("button", { name: "Menu: all pages" }).click();
  for (const name of ["Orchard", "Notebook", "Map", "Settings", "About", "How to use"]) {
    await expect(menu.getByRole("link", { name, exact: true })).toBeVisible();
  }
  await expect(menu.getByRole("link", { name: "Log in", exact: true })).toHaveCount(0);
  await menu.getByRole("link", { name: "How to use", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "How to use" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to your orchard" })).toBeVisible();

  // The orchard's own More menu links to the guides too.
  await page.goto("/orchard");
  await waitForOrchard(page);
  await page.getByRole("button", { name: /More:/ }).click();
  await page.getByRole("link", { name: "About", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "About" })).toBeVisible();
  expect(errors).toEqual([]);
});
