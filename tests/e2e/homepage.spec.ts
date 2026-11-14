import { expect, test, type Page } from "@playwright/test";

async function demoRecords(page: Page) {
  return page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const request = indexedDB.open("missionpulse-demo-v1", 1);
        request.onerror = () =>
          reject(Error("Cannot inspect isolated demo storage"));
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("checkIns", "readonly");
          const read = tx.objectStore("checkIns").getAll();
          read.onsuccess = () => resolve(JSON.stringify(read.result));
          read.onerror = () =>
            reject(Error("Cannot read isolated demo records"));
          tx.oncomplete = () => db.close();
        };
      }),
  );
}

test("homepage and welcome show the same beginner experience without initializing demo storage", async ({
  page,
}, testInfo) => {
  for (const route of ["/", "/welcome"]) {
    await page.goto(route);
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Your Health Companion, Beyond Earth.",
    );
    await expect(
      page.getByRole("link", { name: "Try Interactive Demo", exact: true }),
    ).toHaveAttribute("href", "/demo");
    await expect(
      page.getByRole("link", { name: "Create Account", exact: true }),
    ).toHaveAttribute("href", "/auth/signup");
    await expect(
      page.getByRole("link", { name: "Sign In", exact: true }),
    ).toHaveAttribute("href", "/auth/login");
    await expect(page.locator(".sidebar")).toHaveCount(0);
    expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Your Health Companion, Beyond Earth.",
  );
  await page.screenshot({
    path: testInfo.outputPath("public-homepage.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Welcome back" }),
  ).toBeVisible();
  await page.goto("/");
  await page.getByRole("link", { name: "Create Account", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/signup$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Create your account" }),
  ).toBeVisible();
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
});

test("homepage demo entry and dashboard return links preserve existing browser records", async ({
  page,
}) => {
  await page.goto("/demo/overview");
  await expect(
    page.locator(".metric-card").first().locator(".metric-value"),
  ).toBeVisible();
  const before = await demoRecords(page);
  expect(JSON.parse(before).length).toBeGreaterThan(0);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Your Health Companion, Beyond Earth.",
  );
  expect(await demoRecords(page)).toBe(before);
  await page
    .getByRole("link", { name: "Try Interactive Demo", exact: true })
    .click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Explore MissionPulse Demo" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Open Mission Overview", exact: true })
    .click();
  await expect(page).toHaveURL(/\/demo\/overview$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Mission Overview",
      exact: true,
    }),
  ).toBeVisible();
  expect(await demoRecords(page)).toBe(before);
  await page.goto("/crew-profile");
  await page
    .getByRole("link", { name: "Back to Mission Overview", exact: true })
    .click();
  await expect(page).toHaveURL(/\/demo\/overview$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Mission Overview",
      exact: true,
    }),
  ).toBeVisible();
});
