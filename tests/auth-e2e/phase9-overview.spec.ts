import { expect, test, type Page } from "@playwright/test";
import { shiftDate } from "../../src/lib/health/dates";
const fixture = "http://127.0.0.1:4400";

async function login(page: Page) {
  await page.goto("/auth/login");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("fixture-b@example.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fictional-passphrase");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.locator(".overview-status")).toBeVisible();
}

test.beforeEach(async ({ request }) => {
  await request.post(`${fixture}/__fixture/reset`);
});

test("overview has one hero and no duplicate panels, with working primary and secondary navigation", async ({
  page,
  request,
}, testInfo) => {
  await login(page);
  await expect(page.locator(".overview-status")).toContainText(
    "0 saved check-ins",
  );
  await expect(page.locator(".overview-hero")).toContainText(
    "Private B mission",
  );
  await expect(page.locator(".overview-hero")).toContainText("TEST-B");
  await expect(page.locator(".overview-hero")).toContainText("Spacecraft");
  await expect(
    page.locator(
      ".personal-next, .overview-more-actions, .records-empty, .journey-heading, .personal-privacy-note",
    ),
  ).toHaveCount(0);
  await expect(page.locator(".account-footer")).toContainText(
    "No clinical assessment",
  );
  for (const [action, route, title] of [
    [
      "Start Daily Check-In",
      "/astronaut/daily-health-check",
      "Daily Health Check",
    ],
    ["View My Records", "/astronaut/health-history", "Health History"],
    ["See Health Trends", "/astronaut/health-insights", "Understand Your Health"],
  ]) {
    const card = page.locator(".journey-card").filter({ hasText: action });
    await expect(card).toHaveAttribute("href", route);
    await card.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("heading", { level: 1, name: title, exact: true }),
    ).toBeVisible();
    if (route.endsWith("health-history"))
      await expect(
        page.getByRole("heading", {
          name: "Your history starts with one check-in",
          exact: true,
        }),
      ).toBeVisible();
    await page.goto("/astronaut");
    await expect(page.locator(".overview-status")).toContainText(
      "0 saved check-ins",
    );
  }
  await page
    .locator(".journey-secondary")
    .getByRole("link", { name: "My Profile", exact: true })
    .click();
  await expect(page).toHaveURL(/\/astronaut\/profile$/);
  await expect(
    page.getByRole("heading", { name: "Your mission profile", exact: true }),
  ).toBeVisible();
  await page.goto("/astronaut");
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
  await page
    .locator(".journey-secondary")
    .getByRole("link", { name: "NASA Space Health Guide" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Space Health Knowledge", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Understand Your Health", exact: true }),
  ).toBeVisible();
  await page.goto("/astronaut");
  await expect(page.locator(".overview-status")).toContainText(
    "0 saved check-ins",
  );
  expect(
    await request
      .get(`${fixture}/__fixture/records`)
      .then((response) => response.json()),
  ).toHaveLength(0);
  await expect(page.getByText("Alex Morgan", { exact: false })).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("overview-empty.png"),
    fullPage: true,
  });
});

test("multiple saved records keep accurate status and survive overview reloads and viewport changes", async ({
  page,
  request,
}, testInfo) => {
  await login(page);
  for (const offset of [0, -1]) {
    await page.goto("/astronaut/daily-health-check");
    const input = page.getByLabel("Mission-local date", { exact: false });
    const today = await input.inputValue();
    await input.fill(shiftDate(today, offset));
    for (const [label, value] of [
      ["Resting heart rate", "79"],
      ["Systolic blood pressure", "120"],
      ["Diastolic blood pressure", "80"],
      ["Body temperature", "36.8"],
      ["Sleep duration", "7.5"],
      ["Exercise duration", "30"],
    ])
      await page.getByLabel(label, { exact: false }).fill(value);
    await page.getByLabel("Mood", { exact: false }).selectOption("calm");
    await page.getByLabel("Fatigue level", { exact: false }).selectOption("3");
    await page
      .getByRole("button", { name: "Save personal check-in", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Personal check-in saved",
        exact: true,
      }),
    ).toBeVisible();
  }
  const original = await request
    .get(`${fixture}/__fixture/records`)
    .then((response) => response.json());
  expect(original).toHaveLength(2);
  expect(
    original.every((record: { spo2: unknown }) => record.spo2 === null),
  ).toBe(true);
  await page.goto("/astronaut");
  await expect(page.locator(".overview-status")).toContainText(
    "2 saved check-ins",
  );
  await expect(page.locator(".overview-status")).toContainText(
    "Today’s personal check-in is complete",
  );
  await expect(page.locator(".overview-missing-note")).toContainText(
    "Not recorded",
  );
  for (const [name, width, height] of [
    ["laptop", 1366, 768],
    ["desktop", 1440, 900],
    ["mobile", 390, 844],
    ["zoom-equivalent", 683, 384],
  ] as const) {
    await page.setViewportSize({ width, height });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width >= 1100)
      expect(
        await page.evaluate(() => document.documentElement.scrollHeight),
      ).toBeLessThanOrEqual(height + 1);
    for (const card of await page.locator(".journey-card").all()) {
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible();
    }
    await page.screenshot({
      path: testInfo.outputPath(`${name}-overview-two.png`),
      fullPage: true,
    });
  }
  await page.reload();
  await expect(page.locator(".overview-status")).toContainText(
    "2 saved check-ins",
  );
  const after = await request
    .get(`${fixture}/__fixture/records`)
    .then((response) => response.json());
  expect(after).toEqual(original);
  await page.goto("/astronaut/health-history");
  await expect(page.locator(".checkin-details")).toHaveCount(2);
});
