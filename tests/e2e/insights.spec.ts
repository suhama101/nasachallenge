import { expect, test, type Page } from "@playwright/test";
async function navigate(page: Page, name: string) {
  const menu = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("link", { name, exact: true }).click();
}
async function fillRequired(page: Page) {
  await page.getByLabel("Resting heart rate", { exact: false }).fill("75");
  await page
    .getByLabel("Systolic blood pressure", { exact: false })
    .fill("122");
  await page
    .getByLabel("Diastolic blood pressure", { exact: false })
    .fill("80");
  await page.getByLabel("Body temperature", { exact: false }).fill("36.8");
  await page.getByLabel("Blood oxygen saturation", { exact: false }).fill("98");
  await page.getByLabel("Sleep duration", { exact: false }).fill("7.2");
  await page.getByLabel("Exercise duration", { exact: false }).fill("60");
  await page.getByLabel("Mood", { exact: false }).selectOption("neutral");
  await page.getByLabel("Fatigue level", { exact: false }).selectOption("3");
}
test("isolated scenarios, evidence, analytics and dashboard agree without changing history", async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  // Verify scenario isolation against a previously saved user-entered record,
  // in addition to the existing synthetic seed records.
  await page.goto("/daily-health-check");
  await expect(
    page.getByLabel("Resting heart rate", { exact: false }),
  ).toBeVisible();
  await fillRequired(page);
  await page
    .getByLabel("Notes", { exact: false })
    .fill("Scenario isolation sentinel — fictional saved entry");
  await page
    .getByRole("button", { name: "Save demo check-in", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Demo check-in saved" }),
  ).toBeVisible();
  await page.goto("/demo/overview");
  await expect(page.locator(".metric-value").first()).toBeVisible();
  const savedHeart = await page.locator(".metric-value").first().textContent();
  await navigate(page, "Health Insights");
  await expect(
    page.getByLabel("Analysis dataset", { exact: true }),
  ).toHaveValue("saved");
  await page
    .getByLabel("Analysis dataset", { exact: true })
    .selectOption("routine");
  await expect(
    page.locator(".insights-observation-grid .category-stable").first(),
  ).toBeVisible();
  await page
    .getByLabel("Analysis dataset", { exact: true })
    .selectOption("sleep-fatigue");
  const pattern = page.locator(
    '.insight-card[data-insight-id^="sleep-fatigue-"]',
  );
  await expect(pattern).toBeVisible();
  await expect(pattern).toContainText("cannot establish a cause");
  const patternId = await pattern.getAttribute("data-insight-id");
  await pattern.locator(".insight-evidence summary").click();
  await expect(pattern.getByRole("table")).toBeVisible();
  await page
    .getByLabel("Analytics time range", { exact: true })
    .selectOption("30");
  await page
    .getByLabel("Trend indicator", { exact: true })
    .selectOption("spo2");
  await expect(
    page.locator(".insights-charts .recharts-line-curve").first(),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("health-insights.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await navigate(page, "Mission Overview");
  await expect(
    page.locator(`.insight-summary [data-insight-id="${patternId}"]`),
  ).toBeVisible();
  await expect(
    page.getByText("Isolated synthetic scenario preview", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".metric-value").first()).toHaveText(savedHeart!);
  await navigate(page, "Health Insights");
  await expect(
    page.getByLabel("Analysis dataset", { exact: true }),
  ).toHaveValue("sleep-fatigue");
  await page
    .getByLabel("Minimum earlier baseline days", { exact: true })
    .selectOption("10");
  await expect(
    page.locator('.insight-card[data-insight-id^="sleep-fatigue-"]'),
  ).toBeVisible();
  await page
    .getByLabel("Analysis dataset", { exact: true })
    .selectOption("heart-rate");
  await expect(
    page.locator('.insight-card[data-insight-id^="indicator-heartRate-"]'),
  ).toContainText("98 bpm");
  await page
    .getByRole("checkbox", {
      name: "Simulate an additional urgent-symptom report",
      exact: false,
    })
    .check();
  await expect(page.locator(".urgent-insight")).toContainText(
    "immediate assessment",
  );
  await expect(page.locator(".insights-observation-grid")).toHaveCount(0);
  await expect(page.locator(".monitoring-badge.category-stable")).toHaveCount(
    0,
  );
  await navigate(page, "Health History");
  await expect(
    page.getByRole("status").filter({ hasText: "15 of 15 check-ins" }),
  ).toBeVisible();
  await page.locator(".checkin-details").first().locator("summary").click();
  await expect(page.locator(".checkin-details").first()).toContainText(
    "Scenario isolation sentinel — fictional saved entry",
  );
  await navigate(page, "Health Insights");
  await page
    .getByRole("button", { name: "Return to saved records", exact: true })
    .click();
  await expect(
    page.getByLabel("Analysis dataset", { exact: true }),
  ).toHaveValue("saved");
  await expect(page.locator(".urgent-insight")).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByLabel("Analysis dataset", { exact: true }),
  ).toHaveValue("saved");
  expect(runtimeErrors).toEqual([]);
});

test("explicit urgent report persists and overrides statistical reassurance", async ({
  page,
}) => {
  await page.goto("/daily-health-check");
  const checkbox = page.getByRole("checkbox", {
    name: "I am reporting an urgent symptom",
    exact: false,
  });
  await expect(checkbox).toBeVisible();
  await checkbox.check();
  await expect(page.locator(".urgent-banner")).toContainText(
    "Seek immediate assessment",
  );
  await expect(page.locator(".urgent-banner")).toContainText(
    "Do not wait to complete this form",
  );
  await fillRequired(page);
  await page
    .getByRole("button", { name: "Save demo check-in", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Demo check-in saved" }),
  ).toBeVisible();
  await navigate(page, "Health Insights");
  await expect(page.locator(".urgent-insight")).toContainText(
    "No approved medical escalation protocol",
  );
  await expect(page.locator(".monitoring-badge.category-stable")).toHaveCount(
    0,
  );
  const urgentId = await page
    .locator(".urgent-insight")
    .getAttribute("data-insight-id");
  await navigate(page, "Mission Overview");
  await expect(
    page.locator(`.insight-summary [data-insight-id="${urgentId}"]`),
  ).toContainText("immediate assessment");
  await navigate(page, "Health Insights");
  await page.reload();
  await expect(page.locator(".urgent-insight")).toBeVisible();
  await navigate(page, "Health History");
  await page.locator(".checkin-details").first().locator("summary").click();
  await expect(page.locator(".checkin-details").first()).toContainText(
    "Yes — immediate assessment",
  );
});
