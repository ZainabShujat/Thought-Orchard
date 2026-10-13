import { expect, test } from "@playwright/test";
import { completeOnboarding, newAccount, plantThought, register, waitForOrchard } from "./helpers";

/** 10. A second account gets its own, separate, private orchard. */
test("two accounts never see or change each other's thoughts", async ({ browser }) => {
  const a = await browser.newContext();
  const b = await browser.newContext();
  const pageA = await a.newPage();
  const pageB = await b.newPage();

  await register(pageA, newAccount("Alpha"));
  await completeOnboarding(pageA, { displayName: "Alpha" });
  await waitForOrchard(pageA);
  await plantThought(pageA, "Alpha's private thought");
  const alphaThoughts = (await (await pageA.request.get("/api/thoughts")).json()).thoughts;
  const alphaId: string = alphaThoughts[0]._id;

  await register(pageB, newAccount("Beta"));
  await completeOnboarding(pageB, { displayName: "Beta" });
  await waitForOrchard(pageB);

  // Beta's orchard is empty and separate.
  await expect(pageB.getByText("Your orchard is waiting.")).toBeVisible();
  const betaList = (await (await pageB.request.get("/api/thoughts")).json()).thoughts;
  expect(betaList).toEqual([]);

  // Beta can't reach Alpha's thought by ID, by any method.
  expect((await pageB.request.get(`/api/thoughts/${alphaId}`)).status()).toBe(404);
  expect((await pageB.request.patch(`/api/thoughts/${alphaId}`, { data: { content: "hacked" } })).status()).toBe(404);
  expect(
    (await pageB.request.post(`/api/thoughts/${alphaId}/care`, { data: { type: "water", idempotencyKey: "beta-key-0001" } })).status()
  ).toBe(404);
  expect((await pageB.request.delete(`/api/thoughts/${alphaId}`)).status()).toBe(404);

  // Visiting Alpha's tree URL as Beta opens nothing.
  await pageB.goto(`/orchard?tree=${alphaId}`);
  await waitForOrchard(pageB);
  await expect(pageB.getByRole("dialog", { name: /New Thought/ })).toHaveCount(0);

  // Alpha's thought is unchanged.
  const after = (await (await pageA.request.get("/api/thoughts")).json()).thoughts;
  expect(after).toHaveLength(1);
  expect(after[0].content).toBe("Alpha's private thought");
  expect(after[0].care).toEqual([]);

  // Beta's first tree also starts at the heart of Beta's own grove.
  await plantThought(pageB, "Beta's own thought");
  const betaAfter = (await (await pageB.request.get("/api/thoughts")).json()).thoughts;
  expect(betaAfter[0].position).toEqual({ x: 0, z: 0 });
  expect(betaAfter[0].orchardId).not.toBe(after[0].orchardId);

  await a.close();
  await b.close();
});
