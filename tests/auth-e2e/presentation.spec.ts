import { expect, test } from "@playwright/test";

test("personal overview action cards keep navigation scoped to the account", async ({
  page,
  request,
}, testInfo) => {
  await request.post("http://127.0.0.1:4400/__fixture/reset");
  await page.goto("/auth/login");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("fixture-b@example.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fictional-passphrase");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Fixture B" }),
  ).toBeVisible();
  await expect(page.locator(".journey-card")).toHaveCount(3);
  await page.screenshot({
    path: testInfo.outputPath("personal-overview-phase7.png"),
    fullPage: true,
  });
  for (const [label, path, heading] of [
    [
      "Start Daily Check-In",
      "/astronaut/daily-health-check",
      "Daily Health Check",
    ],
    ["View My Records", "/astronaut/health-history", "Health History"],
    ["See Health Trends", "/astronaut/health-insights", "Health Insights"],
  ]) {
    await page.goto("/astronaut");
    const card = page.locator(".journey-card").filter({ hasText: label });
    await expect(card).toHaveAttribute("href", path);
    await card.click();
    await expect(
      page.getByRole("heading", { name: heading, level: 1, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
  }
  await page.goto("/astronaut");
  await page
    .locator(".journey-secondary")
    .getByRole("link", { name: "My Profile" })
    .click();
  await expect(page).toHaveURL(/\/astronaut\/profile$/);
  await expect(
    page.getByRole("heading", { name: "Your mission profile", exact: true }),
  ).toBeVisible();
  await page.goto("/astronaut");
  await page
    .locator(".journey-secondary")
    .getByRole("link", { name: "Space Health Guide" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Space Health Knowledge", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Fixture B", { exact: false })).toHaveCount(0);
  await page.goto("/astronaut");
  await expect(
    page.getByRole("heading", { name: "Welcome, Fixture B" }),
  ).toBeVisible();
});
