import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

// Only the loopback fixture receives these fictional records and credentials.
const fixture = "http://127.0.0.1:4400";
const captureBefore = process.env.INSIGHTS_CAPTURE_BEFORE === "1";
function rows(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const time = new Date(
      now.getTime() - (count - 1 - i) * 86400000,
    ).toISOString();
    return {
      id: crypto.randomUUID(),
      astronaut_profile_id: "22222222-2222-4222-8222-222222222222",
      mission_local_date: time.slice(0, 10),
      recorded_at: time,
      created_at: time,
      updated_at: time,
      heart_rate: i === count - 1 ? 92 : 70,
      systolic: 120,
      diastolic: 80,
      temperature: 36.8,
      spo2: i === count - 1 ? null : 98,
      glucose: null,
      water: null,
      sleep: 7.5,
      exercise: 30,
      mood: "calm",
      fatigue: 3,
      symptoms: [],
      notes: "Fictional Insights presentation fixture only.",
      urgent_symptom_reported: false,
      data_source: "user-entered",
    };
  });
}
async function login(page: Page) {
  await page.goto("/auth/login");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("fixture-b@example.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fictional-passphrase");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/astronaut$/);
  await page.goto("/astronaut/health-insights");
}
test("guided Insights: zero, one, two and five-earlier-days states preserve records and education", async ({
  page,
  request,
  context,
}, info) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const count of [0, 1, 2, 6]) {
    await context.clearCookies();
    await request.post(`${fixture}/__fixture/reset`);
    const records = rows(count);
    await request.post(`${fixture}/__fixture/health-data`, {
      data: { records },
    });
    await login(page);
    await expect(page.locator(".indicator-lesson")).toHaveCount(11);
    if (!captureBefore) {
      await expect(
        page.getByRole("heading", { name: "Understand Your Health", level: 1 }),
      ).toBeVisible();
      await expect(page.locator(".insights-disclosure")).toContainText(
        "not a diagnosis",
      );
      const advanced = page.locator(".insights-advanced > summary");
      await expect(advanced).toBeVisible();
      await expect(page.locator(".baseline-table")).not.toBeVisible();
      if (count === 0) {
        await expect(
          page.getByRole("heading", {
            name: "Your health journey starts here.",
          }),
        ).toBeVisible();
        await expect(
          page.getByRole("link", {
            name: "Record My First Check-In",
            exact: true,
          }),
        ).toHaveAttribute("href", "/astronaut/daily-health-check");
        await expect(
          page.locator(".insights-chart-canvas").first(),
        ).not.toBeVisible();
      } else {
        await expect(page.locator(".insights-latest")).toContainText("92 bpm");
        if (info.project.name === "desktop") {
          await expect(
            page.locator('[data-measurement="heartRate"]'),
          ).toBeInViewport();
        }
        await expect(page.locator(".insights-latest time")).toHaveAttribute(
          "datetime",
          records.at(-1)!.mission_local_date,
        );
        await expect(page.locator('[data-measurement="spo2"]')).toContainText(
          "Not recorded",
        );
        await expect(
          page.locator('[data-measurement="glucose"]'),
        ).toContainText("Not recorded");
        await expect(
          page.getByRole("link", {
            name: "View My Health History",
            exact: true,
          }),
        ).toHaveAttribute("href", "/astronaut/health-history");
        if (count === 1) {
          await expect(page.locator(".insights-start")).toContainText(
            "Your first health record is saved.",
          );
          await expect(
            page.locator(".insights-chart-canvas").first(),
          ).not.toBeVisible();
        } else {
          await expect(
            page.getByRole("heading", {
              name: "How Your Health Has Changed",
              exact: true,
            }),
          ).toBeVisible();
          await expect(
            page.locator(".insights-charts .recharts-line-curve").first(),
          ).toBeVisible();
          await expect(
            page
              .getByRole("img", {
                name: /30-day Resting heart rate trend/,
              })
              .locator(".recharts-line-dot"),
          ).toHaveCount(count);
        }
        if (count < 6)
          await expect(page.locator(".insights-comparison")).toContainText(
            "More recorded days are needed",
          );
        else {
          await expect(
            page.locator('.insights-comparison [data-comparison="heartRate"]'),
          ).toContainText("70 bpm");
          await expect(
            page.locator('.insights-comparison [data-comparison="heartRate"]'),
          ).toContainText("92 bpm");
        }
      }
      await page
        .getByRole("link", {
          name: "What Do My Measurements Mean?",
          exact: true,
        })
        .click();
      await expect(page.locator("#indicator-guide-title")).toBeInViewport();
      const lesson = page.locator("#learn-heart-rate > summary");
      await lesson.focus();
      await page.keyboard.press("Enter");
      await expect(
        page.locator("#learn-heart-rate .lesson-help"),
      ).toBeVisible();
      await expect(
        page.locator("#learn-heart-rate .lesson-body"),
      ).toContainText("NASA SOURCE");
      await lesson.press("Enter");
      await advanced.focus();
      await page.keyboard.press("Enter");
      await expect(page.locator(".baseline-table table")).toBeVisible();
      await expect(page.locator(".methodology-details").first()).toBeVisible();
      if (count === 0 || count === 6) {
        const chartDetails = page.locator(".insights-chart-details > summary");
        await chartDetails.focus();
        await page.keyboard.press("Enter");
        const tables = page.getByText("Accessible analytics data tables", {
          exact: true,
        });
        await tables.focus();
        await page.keyboard.press("Enter");
        const chartTable = page.getByRole("table").filter({
          has: page.locator("caption", {
            hasText: "Selected indicator and multi-indicator chart values",
          }),
        });
        await expect(chartTable).toBeVisible();
        if (count === 6) await expect(chartTable).toContainText("92 bpm");
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await chartDetails.focus();
        await page.keyboard.press("Enter");
      }
      await advanced.press("Enter");
      await expect(
        page.getByRole("link", {
          name: "How Does Space Affect Health?",
          exact: true,
        }),
      ).toHaveAttribute("href", "/space-health-knowledge");
      expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (count === 0 || count === 6) {
      await page.screenshot({
        path: path.join(
          "playwright-report/insights-clarity",
          `${captureBefore ? "before" : "after"}-${info.project.name}-${count === 0 ? "zero" : "multi"}.png`,
        ),
        fullPage: true,
      });
      if (!captureBefore) {
        await page.setViewportSize({ width: 683, height: 384 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollHeight > innerHeight,
          ),
        ).toBe(true);
        await page.locator(".insights-advanced > summary").focus();
        await page.keyboard.press("Enter");
        await expect(page.locator(".baseline-table table")).toBeVisible();
        await page.locator(".insights-advanced > summary").press("Enter");
        await page.setViewportSize(info.project.use.viewport!);
      }
    }
    await page.reload();
    await expect(page.locator(".indicator-lesson")).toHaveCount(11);
    if (!captureBefore && count === 0) {
      await page
        .getByRole("link", { name: "Record My First Check-In", exact: true })
        .click();
      await expect(
        page.getByLabel("Resting heart rate", { exact: false }),
      ).toBeVisible();
    }
    if (!captureBefore && count === 6) {
      await page
        .getByRole("link", { name: "View My Health History", exact: true })
        .click();
      await expect(page.locator(".checkin-details")).toHaveCount(6);
    }
    expect(
      await request.get(`${fixture}/__fixture/records`).then((r) => r.json()),
    ).toEqual(records);
  }
  expect(errors).toEqual([]);
});

test("legacy oxygen and repeated same-day entries do not become valid comparisons or get rewritten", async ({
  page,
  request,
}) => {
  test.skip(
    captureBefore,
    "Before screenshots use the unchanged existing behavior.",
  );
  await request.post(`${fixture}/__fixture/reset`);
  const records = rows(6).map((row) => ({
    ...row,
    mission_local_date: new Date().toISOString().slice(0, 10),
    spo2: 0,
  }));
  await request.post(`${fixture}/__fixture/health-data`, { data: { records } });
  await login(page);
  await expect(page.locator('[data-measurement="spo2"]')).toContainText(
    "Needs review",
  );
  await expect(page.locator(".data-review-banner")).toContainText("excluded");
  await expect(page.locator(".insights-comparison")).toContainText(
    "More recorded days are needed",
  );
  await expect(page.locator("[data-comparison]")).toHaveCount(0);
  await page.locator(".insights-advanced > summary").click();
  const oxygen = page
    .locator(".baseline-table tbody tr")
    .filter({ hasText: "SpO" });
  await expect(oxygen).toContainText("Needs review");
  expect(
    await request.get(`${fixture}/__fixture/records`).then((r) => r.json()),
  ).toEqual(records);
});
