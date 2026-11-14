import { expect, test, type Page } from "@playwright/test";
async function fill(page: Page) {
  for (const [label, value] of [
    ["Resting heart rate", "92"],
    ["Systolic blood pressure", "118"],
    ["Diastolic blood pressure", "76"],
    ["Body temperature", "36.8"],
    ["Sleep duration", "4.5"],
    ["Exercise duration", "45"],
  ])
    await page.getByLabel(label, { exact: false }).fill(value);
  await page.getByLabel("Mood", { exact: false }).selectOption("neutral");
  await page.getByLabel("Fatigue level", { exact: false }).selectOption("7");
}
async function rows(page: Page) {
  return page.evaluate(
    () =>
      new Promise<
        {
          id: string;
          notes: string;
          spo2: number | null;
          heartRate: number | null;
        }[]
      >((resolve, reject) => {
        const open = indexedDB.open("missionpulse-demo-v1", 1);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction("checkIns", "readonly");
          const read = tx.objectStore("checkIns").getAll();
          read.onsuccess = () => resolve(read.result);
          read.onerror = () => reject(Error("Read failed"));
          tx.oncomplete = () => db.close();
        };
      }),
  );
}
const oxygenChart = (page: Page) =>
  page.locator(".chart-panel").filter({
    has: page.getByRole("heading", {
      name: "Oxygen saturation",
      exact: true,
    }),
  });
test("optional oxygen remains not recorded through save, history, charts, dashboard and insights", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/daily-health-check");
  await fill(page);
  const oxygen = page.getByLabel("Blood oxygen saturation", { exact: false });
  await expect(oxygen).not.toHaveAttribute("required");
  await expect(oxygen).toHaveAttribute("placeholder", "e.g. 98");
  await expect(oxygen).toHaveAttribute("aria-describedby", /spo2-help/);
  await expect(page.locator("#heartRate-help")).toContainText("resting pulse");
  // The formerly accepted zero now fails without losing any other input.
  await oxygen.fill("0");
  await page
    .getByRole("button", { name: "Save demo check-in", exact: true })
    .click();
  await expect(page.locator("#spo2-error")).toContainText(
    "Zero is not accepted",
  );
  await expect(
    page.getByLabel("Resting heart rate", { exact: false }),
  ).toHaveValue("92");
  expect(await rows(page)).toHaveLength(14);
  await oxygen.fill("101");
  await oxygen.blur();
  await expect(page.locator("#spo2-error")).toContainText("cannot exceed 100");
  await oxygen.fill("");
  await oxygen.blur();
  await expect(oxygen).toHaveAttribute("aria-invalid", "false");
  await page
    .getByLabel("Notes", { exact: false })
    .fill("Fictional optional oxygen browser fixture.");
  await page.locator("form").evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
    (form as HTMLFormElement).requestSubmit();
  });
  await expect(
    page.getByRole("heading", { name: "Demo check-in saved" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/daily-health-check$/);
  await expect(page.locator(".save-confirmation")).toContainText(
    "added successfully",
  );
  await expect(
    page.getByRole("link", { name: "View Health History", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View Health Insights", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Record another check-in", exact: true }),
  ).toBeVisible();
  const saved = await rows(page);
  expect(saved).toHaveLength(15);
  expect(
    saved.find(
      (row) => row.notes === "Fictional optional oxygen browser fixture.",
    )!.spo2,
  ).toBeNull();
  await page
    .getByRole("link", { name: "View Health History", exact: true })
    .click();
  await expect(page.locator(".checkin-details")).toHaveCount(15);
  await page.reload();
  await expect(page.locator(".checkin-details")).toHaveCount(15);
  const detail = page.locator(".checkin-details").first();
  await detail.locator("summary").click();
  await expect(
    detail
      .locator(".record-values > div")
      .filter({ hasText: "SpO₂" })
      .locator("dd"),
  ).toHaveText("Not recorded");
  await expect(detail).toContainText("92 bpm");
  await expect(detail).toContainText("8 measurements recorded");
  const chart = oxygenChart(page);
  await chart.locator(".chart-table summary").click();
  await expect(chart.getByRole("table")).toContainText("Not recorded");
  await expect(chart.locator(".recharts-area-dot")).toHaveCount(14);
  await page.goto("/demo/overview");
  await expect(
    page.getByText("Today’s user-entered demo check-in is complete"),
  ).toBeVisible();
  const card = page.locator(".metric-card").filter({
    has: page.getByRole("heading", {
      name: "Oxygen saturation",
      exact: true,
    }),
  });
  await expect(card).toContainText("Not recorded");
  await expect(card.locator(".metric-value")).not.toContainText("0");
  await page.goto("/health-insights");
  const oxygenRow = page
    .locator(".baseline-table tbody tr")
    .filter({ hasText: "SpO₂" });
  await expect(oxygenRow.locator("td").first()).toHaveText("Not recorded");
  expect(await rows(page)).toEqual(saved);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("missing-oxygen.png"),
    fullPage: true,
  });
});
test("a valid decimal oxygen reading saves exactly, and ordinary validation keeps form values", async ({
  page,
}, testInfo) => {
  await page.goto("/daily-health-check");
  await fill(page);
  await page
    .getByLabel("Blood oxygen saturation", { exact: false })
    .fill("98.5");
  await page
    .getByLabel("Diastolic blood pressure", { exact: false })
    .fill("120");
  await page
    .getByRole("button", { name: "Save demo check-in", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Check your entries" }),
  ).toBeVisible();
  await expect(page.getByLabel("Sleep duration", { exact: false })).toHaveValue(
    "4.5",
  );
  await expect(
    page.getByLabel("Blood oxygen saturation", { exact: false }),
  ).toHaveValue("98.5");
  await page
    .getByLabel("Diastolic blood pressure", { exact: false })
    .fill("76");
  await page.screenshot({
    path: testInfo.outputPath("friendly-form.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Save demo check-in", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Demo check-in saved" }),
  ).toBeVisible();
  expect((await rows(page)).filter((row) => row.spo2 === 98.5)).toHaveLength(1);
  await page
    .getByRole("link", { name: "View Health Insights", exact: true })
    .click();
  await expect(
    page
      .locator(".baseline-table tbody tr")
      .filter({ hasText: "SpO₂" })
      .locator("td")
      .first(),
  ).toHaveText("98.5 %");
  await page.goto("/health-history");
  await expect(page.locator(".checkin-details")).toHaveCount(15);
  const chart = oxygenChart(page);
  await expect(chart.locator(".recharts-area-dot")).toHaveCount(15);
  await page.reload();
  expect((await rows(page)).filter((row) => row.spo2 === 98.5)).toHaveLength(1);
});
test("legacy zero is visibly flagged and excluded without rewriting records or losing other measurements", async ({
  page,
}) => {
  await page.goto("/daily-health-check");
  await fill(page);
  await page.getByLabel("Blood oxygen saturation", { exact: false }).fill("98");
  await page
    .getByLabel("Notes", { exact: false })
    .fill("Fictional legacy-zero preservation sentinel.");
  await page
    .getByRole("button", { name: "Save demo check-in", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Demo check-in saved" }),
  ).toBeVisible();
  // Inject a historical record using the old schema in this isolated test context only.
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("missionpulse-demo-v1", 1);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction("checkIns", "readwrite");
          const store = tx.objectStore("checkIns");
          const read = store.getAll();
          read.onsuccess = () => {
            const row = read.result.find(
              (row) =>
                row.notes === "Fictional legacy-zero preservation sentinel.",
            );
            store.put({ ...row, spo2: 0 });
          };
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(Error("Fixture write failed"));
        };
      }),
  );
  const before = await rows(page);
  await page.goto("/health-history");
  await expect(page.locator(".data-review-banner")).toContainText(
    "original value is preserved",
  );
  const detail = page.locator(".checkin-details").first();
  await expect(detail).toContainText("1 needs review");
  await detail.locator("summary").click();
  await expect(detail).toContainText("0 % — Needs review");
  await expect(detail).toContainText("92 bpm");
  const chart = oxygenChart(page);
  await expect(chart.locator(".recharts-area-dot")).toHaveCount(14);
  await expect(chart.locator(".data-review-note")).toContainText("excluded");
  await page.goto("/health-insights");
  await expect(
    page.getByRole("note", { name: "Oxygen readings need review" }),
  ).toBeVisible();
  await expect(
    page
      .locator(".baseline-table tbody tr")
      .filter({ hasText: "SpO₂" })
      .locator("td")
      .first(),
  ).toContainText("0 % — Needs review");
  await expect(
    page
      .locator(".baseline-table tbody tr")
      .filter({ hasText: "Resting heart rate" })
      .locator("td")
      .first(),
  ).toContainText("92 bpm");
  await expect(
    page.locator('[data-insight-id^="indicator-spo2-"]'),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("note", { name: "Oxygen readings need review" }),
  ).toBeVisible();
  expect(await rows(page)).toEqual(before);
});
