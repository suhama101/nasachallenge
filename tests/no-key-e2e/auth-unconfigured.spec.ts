import { expect, test } from "@playwright/test";
test("unconfigured Astronaut Mode explains setup, never opens demo storage, and preserves demo records", async ({
  page,
}) => {
  await page.goto("/health-history");
  await expect(page.locator(".checkin-details")).toHaveCount(14);
  const before = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const open = indexedDB.open("missionpulse-demo-v1", 1);
        open.onsuccess = () => {
          const db = open.result;
          const read = db
            .transaction("checkIns")
            .objectStore("checkIns")
            .getAll();
          read.onsuccess = () => resolve(read.result);
        };
      }),
  );
  await page.goto("/welcome");
  await expect(
    page.getByRole("heading", { name: "Astronaut Mode", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Explore Demo", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Create Account", exact: true }).click();
  await expect(
    page.getByText("Astronaut accounts are not connected yet.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create Account", exact: true }),
  ).toBeDisabled();
  await expect(page.getByText("Alex Morgan", { exact: false })).toHaveCount(0);
  await page.goto("/astronaut/health-history");
  await expect(page.getByText("Alex Morgan", { exact: false })).toHaveCount(0);
  await page.goto("/astronaut");
  await expect(
    page.getByRole("heading", {
      name: "Your personal workspace is not connected yet",
    }),
  ).toBeVisible();
  const after = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const open = indexedDB.open("missionpulse-demo-v1", 1);
        open.onsuccess = () => {
          const db = open.result;
          const read = db
            .transaction("checkIns")
            .objectStore("checkIns")
            .getAll();
          read.onsuccess = () => resolve(read.result);
        };
      }),
  );
  expect(after).toEqual(before);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("a fresh authentication visit creates no fictional IndexedDB records", async ({
  page,
}) => {
  await page.goto("/auth/login");
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
  await page.goto("/auth/forgot-password");
  await expect(
    page.getByRole("heading", { name: "Reset your password" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send reset link" }),
  ).toBeDisabled();
});
