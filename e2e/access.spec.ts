import { expect, test } from "@playwright/test";
import { completeOnboarding, newAccount, register, trackErrors, waitForOrchard } from "./helpers";

test("protected pages send signed-out visitors to sign in, and the API refuses them", async ({ page }) => {
  for (const path of ["/orchard", "/notebook", "/map", "/settings", "/onboarding"]) {
    await page.goto(path);
    await page.waitForURL("**/login");
  }
  for (const path of ["/api/thoughts", "/api/profile"]) {
    expect((await page.request.get(path)).status()).toBe(401);
  }
  // Development routes don't exist in production.
  expect((await page.request.post("/api/dev/seed", { data: {} })).status()).toBe(404);
  expect((await page.request.post("/api/dev/clock", { data: { offsetDays: 3 } })).status()).toBe(404);
});

test("a signed-up account must finish onboarding before entering the orchard", async ({ page }) => {
  await register(page, newAccount("Onboard"));
  await page.goto("/orchard");
  await page.waitForURL("**/onboarding");
  await completeOnboarding(page);
  await waitForOrchard(page);
  // Signed in: sign-in and register pages send you to the orchard.
  await page.goto("/login");
  await page.waitForURL("**/orchard");
});

test("sign-in errors are clear and don't reveal which part was wrong", async ({ page }) => {
  const account = newAccount("Wrong");
  await register(page, account);
  await completeOnboarding(page);
  await page.context().clearCookies();

  await page.goto("/login");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill("not the right password");
  await page.getByRole("button", { name: "Sign in" }).click();
  const message = page.getByText("That email and password don't match an account.");
  await expect(message).toBeVisible();
  await expect(message).toHaveAttribute("role", "alert");

  await page.getByLabel("Email").fill("nobody-here@example.test");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("That email and password don't match an account.")).toBeVisible();
});

test("registration rejects a duplicate email and short passwords", async ({ page }) => {
  const account = newAccount("Dup");
  await register(page, account);
  await page.context().clearCookies();

  await page.goto("/register");
  await page.getByLabel("Name").fill("Someone");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByLabel("Password again").fill("short");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Use at least 10 characters.")).toBeVisible();

  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByLabel("Password again").fill(account.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("An account with that email already exists. Try signing in instead.")).toBeVisible();
});

test("session cookies are httpOnly, Secure and SameSite=Lax in production", async ({ page }) => {
  await register(page, newAccount("Cookie"));
  const cookies = await page.context().cookies();
  const session = cookies.find((c) => c.name.includes("session_token"));
  expect(session).toBeDefined();
  expect(session!.httpOnly).toBe(true);
  expect(session!.secure).toBe(true);
  expect(session!.sameSite).toBe("Lax");
  expect(session!.name.startsWith("__Secure-")).toBe(true);
});

test("password reset tells the truth when no email provider is configured", async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(page.getByText(/Password reset isn.t available yet/)).toBeVisible();
});

test("support is public and shows verified India resources with an international fallback", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/support");
  await expect(page.getByRole("heading", { name: "Support" })).toBeVisible();
  await page.getByLabel("Country").selectOption("IN");
  await expect(page.getByRole("link", { name: "112" })).toHaveAttribute("href", "tel:112");
  await expect(page.getByText("Tele-MANAS")).toBeVisible();
  await expect(page.getByRole("link", { name: "14416 or 1-800-891-4416" })).toHaveAttribute("href", "tel:14416");
  await page.getByLabel("Country").selectOption("");
  await expect(page.getByRole("link", { name: "findahelpline.com" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("unknown pages show a friendly not-found page", async ({ page }) => {
  const res = await page.goto("/no-such-place");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /doesn.t lead anywhere/ })).toBeVisible();
});
