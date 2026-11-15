import { expect, test } from "@playwright/test";
test("save → reload → filter → dashboard → confirmed reset", async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.goto("/health-history");
  await expect(page.locator(".metric-note")).toHaveText(
    Array(4).fill("Fictional demo measurement; not device telemetry"),
  );
  await expect(page.locator(".metric-source").first()).toContainText(
    "Synthetic demo",
  );
  await page.goto("/daily-health-check");
  await expect(
    page.getByLabel("Resting heart rate", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save demo check-in" }).click();
  await expect(
    page.getByRole("heading", { name: "Check your entries" }),
  ).toBeVisible();
  // Required blanks must not be silently accepted as zero.
  await page.getByLabel("Resting heart rate", { exact: false }).fill("79");
  await page
    .getByLabel("Systolic blood pressure", { exact: false })
    .fill("128");
  await page
    .getByLabel("Diastolic blood pressure", { exact: false })
    .fill("82");
  await page.getByLabel("Body temperature", { exact: false }).fill("36.9");
  await page.getByLabel("Blood oxygen saturation", { exact: false }).fill("97");
  await page.getByLabel("Sleep duration", { exact: false }).fill("6.8");
  await page.getByLabel("Exercise duration", { exact: false }).fill("50");
  await page.getByLabel("Mood", { exact: false }).selectOption("neutral");
  await page.getByLabel("Fatigue level", { exact: false }).selectOption("4");
  await page.getByRole("checkbox", { name: "Headache", exact: true }).check();
  await page
    .getByLabel("Notes", { exact: false })
    .fill("Fictional browser test entry");
  const missionDate = await page
    .getByLabel("Mission-local date", { exact: false })
    .inputValue();
  // Two immediate submit events exercise the synchronous in-flight guard.
  await page.locator("form").evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
    (form as HTMLFormElement).requestSubmit();
  });
  await expect(
    page.getByRole("heading", { name: "Demo check-in saved" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "View Health History", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "15 of 15 check-ins" }),
  ).toBeVisible();
  await expect(page.locator(".metric-note")).toHaveText(
    Array(4).fill("User-entered demo measurement; not device telemetry"),
  );
  await expect(page.locator(".metric-source").first()).toContainText(
    "User-entered demo",
  );
  await page.reload();
  await expect(
    page.getByRole("status").filter({ hasText: "15 of 15 check-ins" }),
  ).toBeVisible();
  await page.locator(".checkin-details").first().locator("summary").click();
  await expect(page.locator(".checkin-details").first()).toContainText(
    "Fictional browser test entry",
  );
  await expect(page.locator(".checkin-details").first()).toContainText(
    "Not recorded",
  );
  await page
    .getByLabel("From mission date", { exact: false })
    .fill(missionDate);
  await page
    .getByLabel("Through mission date", { exact: false })
    .fill(missionDate);
  await expect(
    page.getByRole("status").filter({ hasText: "1 of 15 check-ins" }),
  ).toBeVisible();
  await expect(page.locator(".checkin-details")).toHaveCount(1);
  // A one-check-in range renders two pressure dots, not a line segment.
  await expect(page.locator(".recharts-line-dot")).toHaveCount(2);
  await page.screenshot({
    path: test.info().outputPath("history.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto("/demo/overview");
  await expect(
    page.getByText("Today’s user-entered demo check-in is complete"),
  ).toBeVisible();
  await expect(
    page.locator(".metric-card").first().locator(".metric-value"),
  ).toContainText("79");
  await expect(page.locator(".recharts-area-curve").first()).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("dashboard.png"),
    fullPage: true,
  });
  await page.getByLabel("Chart date range").selectOption("7");
  await page.locator(".chart-table").first().locator("summary").click();
  await expect(page.locator(".chart-table").first()).toContainText("79 bpm");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto("/health-history");
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep records" }).click();
  await expect(page.locator(".checkin-details")).toHaveCount(15);
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await page.getByRole("button", { name: "Delete all demo records" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Your history starts with one check-in.",
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Your history starts with one check-in.",
    }),
  ).toBeVisible();
  await page.goto("/demo/overview");
  await expect(
    page.getByRole("heading", { name: "No check-ins yet" }),
  ).toBeVisible();
  await expect(page.locator(".metric-card").first()).toContainText(
    "Not recorded",
  );
  expect(runtimeErrors).toEqual([]);
});
