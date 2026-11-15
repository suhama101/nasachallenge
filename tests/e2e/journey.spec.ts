import { expect, test, type Page } from "@playwright/test";
import { displayDate } from "../../src/lib/health/dates";
async function navigate(page: Page, name: string) {
  const button = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  if (await button.isVisible()) await button.click();
  await page.getByRole("link", { name, exact: true }).click();
}
async function storedRows(page: Page) {
  return page.evaluate(
    () =>
      new Promise<unknown[]>((resolve, reject) => {
        const request = indexedDB.open("missionpulse-demo-v1", 1);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("checkIns", "readonly");
          const read = tx.objectStore("checkIns").getAll();
          read.onsuccess = () => resolve(read.result);
          read.onerror = () =>
            reject(Error("Cannot read isolated test records"));
          tx.oncomplete = () => db.close();
        };
        request.onerror = () =>
          reject(Error("Cannot open isolated test storage"));
      }),
  );
}
test("complete astronaut journey preserves saved data and selected scenarios across modules", async ({
  page,
}, testInfo) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  let apiPosts = 0;
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("/api/assistant") && request.method() === "POST")
      apiPosts++;
  });
  await page.goto("/demo/overview");
  await page
    .getByRole("link", { name: "Explore MissionPulse Demo", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Explore MissionPulse Demo",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Start the saved-record journey", exact: false })
    .click();
  const date = await page
    .getByLabel("Mission-local date", { exact: false })
    .inputValue();
  for (const [label, value] of [
    ["Resting heart rate", "84"],
    ["Systolic blood pressure", "124"],
    ["Diastolic blood pressure", "82"],
    ["Body temperature", "36.7"],
    ["Blood oxygen saturation", "98"],
    ["Sleep duration", "4.8"],
    ["Exercise duration", "45"],
  ])
    await page.getByLabel(label, { exact: false }).fill(value);
  await page.getByLabel("Mood", { exact: false }).selectOption("neutral");
  await page.getByLabel("Fatigue level", { exact: false }).selectOption("6");
  await page
    .getByLabel("Notes", { exact: false })
    .fill("Fictional judge-journey sentinel; not medical information.");
  await page
    .getByRole("button", { name: "Save demo check-in", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Demo check-in saved" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "View Health History", exact: true }).click();
  await expect(page.locator(".checkin-details")).toHaveCount(15);
  await page.reload();
  await expect(page.locator(".checkin-details")).toHaveCount(15);
  await page.locator(".checkin-details").first().locator("summary").click();
  await expect(page.locator(".checkin-details").first()).toContainText(
    "84 bpm",
  );
  await expect(page.locator(".checkin-details").first()).toContainText(
    "4.8 hours",
  );
  const saved = await storedRows(page);
  await navigate(page, "Mission Overview");
  await expect(page.locator(".metric-value").first()).toHaveText(/84\s*bpm/);
  await expect(
    page.getByText("Today’s user-entered demo check-in is complete"),
  ).toBeVisible();
  await navigate(page, "Health Insights");
  await expect(
    page.getByLabel("Analysis dataset", { exact: true }),
  ).toHaveValue("saved");
  await expect(
    page
      .locator(".baseline-table tbody tr")
      .filter({ hasText: "Sleep duration" }),
  ).toContainText("4.8 hours");
  await navigate(page, "AI Health Assistant");
  await expect(
    page.getByLabel("Assistant dataset", { exact: false }),
  ).toHaveValue("saved");
  await page
    .getByLabel("Use selected demo measurements for this message", {
      exact: true,
    })
    .check();
  await page
    .getByLabel("Your question", { exact: true })
    .fill("How has my sleep changed over the last seven days?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".answer-recorded")).toContainText(
    `${displayDate(date)}: 4.8 hours`,
  );
  await expect(
    page.getByLabel("Use selected demo measurements for this message", {
      exact: true,
    }),
  ).not.toBeChecked();
  expect(apiPosts).toBe(0);
  await navigate(page, "Space Health Knowledge");
  await page.getByLabel("Search approved topics").fill("sleep");
  await page
    .getByRole("link", {
      name: "Explore Sleep disruption and irregular schedules",
    })
    .click();
  await expect(
    page.getByRole("link", { name: "Open official resource" }),
  ).toHaveAttribute(
    "href",
    "https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/",
  );
  await navigate(page, "Mission Overview");
  await page
    .getByRole("link", { name: "Explore MissionPulse Demo", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Open scenario B", exact: true })
    .click();
  await expect(
    page.getByLabel("Analysis dataset", { exact: true }),
  ).toHaveValue("sleep-fatigue");
  await expect(page.getByLabel("Trend indicator", { exact: true })).toHaveValue(
    "sleep",
  );
  await expect(
    page.locator('[data-insight-id^="sleep-fatigue-"]'),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Explore related NASA research" })
    .click();
  await navigate(page, "AI Health Assistant");
  await expect(
    page.getByLabel("Assistant dataset", { exact: false }),
  ).toHaveValue("sleep-fatigue");
  await navigate(page, "Health Insights");
  await expect(
    page.getByLabel("Analysis dataset", { exact: true }),
  ).toHaveValue("sleep-fatigue");
  for (const scenario of ["heart-rate", "routine"]) {
    await page
      .getByLabel("Analysis dataset", { exact: true })
      .selectOption(scenario);
    await expect(
      page.getByRole("link", { name: "Explore related NASA research" }),
    ).toHaveAttribute("href", "/space-health-knowledge/cardiovascular");
    await expect(
      page.getByLabel("Trend indicator", { exact: true }),
    ).toHaveValue("heartRate");
  }
  expect(await storedRows(page)).toEqual(saved);
  await page.locator(".insights-advanced > summary").click();
  await page
    .getByText("Indicator calculations, assumptions & all baseline values", {
      exact: true,
    })
    .click();
  const oxygenMethod = page
    .locator(".indicator-method")
    .filter({ has: page.getByRole("heading", { name: "SpO₂", exact: true }) });
  await expect(oxygenMethod).toContainText(
    "percentage points per calendar day",
  );
  await page
    .getByRole("button", { name: "Return to saved records", exact: true })
    .click();
  await expect(
    page
      .locator(".baseline-table tbody tr")
      .filter({ hasText: "Resting heart rate" }),
  ).toContainText("84 bpm");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("journey.png"),
    fullPage: true,
  });
});
test("keyboard navigation, mobile menu, chart alternatives and demo entry are operable", async ({
  page,
}) => {
  await page.goto("/demo/overview");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  const entry = page.getByRole("link", {
    name: "Explore MissionPulse Demo",
    exact: true,
  });
  await entry.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", {
      name: "Explore MissionPulse Demo",
      exact: true,
    }),
  ).toBeVisible();
  const open = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  if (await open.isVisible()) {
    await open.focus();
    await page.keyboard.press("Space");
    await expect(
      page.getByRole("dialog", { name: "Application navigation" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(open).toBeFocused();
  }
  await navigate(page, "Health History");
  await page.locator(".chart-table").first().locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(
    page.locator(".chart-table").first().getByRole("table"),
  ).toBeVisible();
  await expect(page.locator('a[href="/crew-profile"]')).toHaveCount(0);
  await expect(page.locator(".header-right .avatar")).toBeVisible();
  await expect(page.locator(".header-right .avatar")).toHaveText("AM");
});
