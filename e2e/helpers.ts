import { expect, Page } from "@playwright/test";
import { E2E_PASSWORD } from "./fixtures/accounts";

export interface Account {
  name: string;
  email: string;
  password: string;
}

let counter = 0;
export function newAccount(label: string): Account {
  counter += 1;
  return {
    name: `${label} Tester`,
    email: `${label.toLowerCase()}-${Date.now()}-${counter}@example.test`,
    password: E2E_PASSWORD,
  };
}

/** Collect uncaught page errors so a test can assert there were none. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

export async function register(page: Page, account: Account) {
  await page.goto("/register");
  await page.getByLabel("Name").fill(account.name);
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByLabel("Password again").fill(account.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/onboarding");
}

export async function completeOnboarding(page: Page, options: { displayName?: string; plainFont?: boolean } = {}) {
  if (options.displayName) await page.getByLabel("Name").fill(options.displayName);
  await page.getByRole("button", { name: "Next" }).click();
  if (options.plainFont) await page.getByLabel("Use a plain, easier-to-read font").check();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: /Your orchard is ready/ })).toBeVisible();
  await page.getByRole("button", { name: "Enter the orchard" }).click();
  await page.waitForURL("**/orchard");
}

export async function signIn(page: Page, account: Account) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/orchard");
}

export async function waitForOrchard(page: Page) {
  await expect(page.getByRole("navigation", { name: "Orchard actions" })).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible({ timeout: 45_000 });
}

export async function plantThought(page: Page, text: string) {
  await page.getByRole("button", { name: "Plant", exact: true }).click();
  await page.getByLabel("Your thought").fill(text);
  await page.getByRole("dialog", { name: "Plant a thought" }).getByRole("button", { name: "Plant" }).click();
  const panel = page.getByRole("dialog", { name: /New Thought/ });
  await expect(panel).toContainText(text);
  return panel;
}

export async function logOut(page: Page) {
  await page.getByRole("button", { name: /More:/ }).click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/");
}
