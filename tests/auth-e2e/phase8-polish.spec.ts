import { expect, test } from "@playwright/test";
import { displayDate } from "../../src/lib/health/dates";

test("compact overview preserves actions and one-record charts at desktop, mobile and zoom-equivalent sizes", async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(90000);
  await request.post("http://127.0.0.1:4400/__fixture/reset");
  await page.goto("/auth/login");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("fixture-b@example.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fictional-passphrase");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.locator(".journey-card")).toHaveCount(3);
  let missionDate = "";
  for (const state of ["empty", "one"]) {
    if (state === "one") {
      await page.goto("/astronaut/daily-health-check");
      missionDate = await page
        .getByLabel("Mission-local date", { exact: false })
        .inputValue();
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
      await page
        .getByLabel("Fatigue level", { exact: false })
        .selectOption("3");
      await page
        .getByRole("button", { name: "Save personal check-in", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Personal check-in saved" }),
      ).toBeVisible();
      await page.goto("/astronaut");
      await expect(page.locator(".journey-card")).toHaveCount(3);
    }
    for (const [name, width, height] of [
      ["desktop", 1440, 900],
      ["laptop", 1366, 768],
      ["mobile", 390, 844],
      ["zoom-equivalent", 683, 384],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => window.scrollTo(0, 0));
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${name}: no horizontal clipping`,
      ).toBe(true);
      if (width >= 1100) {
        expect(
          await page.evaluate(() => document.documentElement.scrollHeight),
          `${name}: default dashboard fits naturally`,
        ).toBeLessThanOrEqual(height + 1);
        expect(
          (await page.locator(".profile-summary").boundingBox())!.y +
            (await page.locator(".profile-summary").boundingBox())!.height,
        ).toBeLessThan(height);
      } else {
        expect(
          await page.evaluate(() => document.documentElement.scrollHeight),
        ).toBeGreaterThan(height);
      }
      for (const card of await page.locator(".journey-card").all()) {
        await card.scrollIntoViewIfNeeded();
        await expect(card).toBeVisible();
        expect((await card.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      await page.screenshot({
        path: testInfo.outputPath(`${name}-dashboard-${state}.png`),
        fullPage: true,
      });
    }
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  await expect(page.locator(".overview-status")).toContainText(
    "1 saved check-in",
  );
  await expect(
    page.locator(".personal-next, .overview-more-actions"),
  ).toHaveCount(0);
  const historyCard = page
    .locator(".journey-card")
    .filter({ hasText: "View My Records" });
  await historyCard.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", {
      name: "Health History",
      level: 1,
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/astronaut");
  const measurements = page.locator(".overview-measurements > summary");
  await measurements.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".metrics-grid")).toBeVisible();
  await expect(page.locator(".chart-panel")).toHaveCount(5);
  await page.goto("/astronaut/health-history");
  const heart = page.locator('.chart-panel[data-indicator="heartRate"]');
  await expect(heart.locator(".recharts-area-dot")).toHaveCount(1);
  await expect(heart.locator(".chart-single-note")).toContainText(
    "does not establish a trend",
  );
  const curve = heart.locator(".recharts-area-curve");
  if (await curve.count()) {
    const xValues = await curve.evaluateAll((nodes) =>
      nodes.flatMap((node) =>
        [...(node.getAttribute("d") || "").matchAll(/[ML]([\d.-]+),/g)].map(
          (match) => Number(match[1]),
        ),
      ),
    );
    expect(new Set(xValues).size).toBeLessThanOrEqual(1);
  }
  await heart.locator(".recharts-area-dot").hover({ force: true });
  await expect(heart.locator(".recharts-tooltip-wrapper")).toContainText(
    "79 bpm",
  );
  await expect(heart.locator(".recharts-tooltip-wrapper")).toContainText(
    displayDate(missionDate),
  );
  await heart.locator(".chart-table summary").click();
  await expect(heart.getByRole("table")).toContainText("79 bpm");
  const pressure = page.locator('.chart-panel[data-indicator="bloodPressure"]');
  await expect(pressure).toContainText(
    "Solid blue: systolic / Dashed violet: diastolic",
  );
  await expect(
    page.locator('.chart-panel[data-indicator="spo2"] .chart-empty'),
  ).toContainText("No oxygen saturation values");
  await page.screenshot({
    path: testInfo.outputPath("one-record-health-charts.png"),
    fullPage: true,
  });
  await page.goto("/astronaut/health-insights");
  await page
    .getByRole("link", { name: "What Do My Measurements Mean?", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Understand Your Health",
      level: 2,
      exact: true,
    }),
  ).toBeInViewport();
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
});
