import { expect, test, type Page } from "@playwright/test";

async function snapshot(page: Page) {
  return page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const request = indexedDB.open("missionpulse-demo-v1", 1);
        request.onerror = () =>
          reject(Error("Cannot read isolated demo fixture"));
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("checkIns", "readonly");
          const read = tx.objectStore("checkIns").getAll();
          read.onsuccess = () => resolve(JSON.stringify(read.result));
          read.onerror = () => reject(Error("Cannot read demo records"));
          tx.oncomplete = () => db.close();
        };
      }),
  );
}

test("all six demo sidebar destinations work by keyboard without a placeholder link or record changes", async ({
  page,
}) => {
  await page.goto("/demo/overview");
  await expect(page.locator(".metric-value").first()).toBeVisible();
  const before = await snapshot(page);
  await expect(page.locator(".sidebar nav a")).toHaveCount(6);
  await expect(page.locator('a[href="/crew-profile"]')).toHaveCount(0);
  await expect(page.locator(".crew-link")).toContainText("Alex Morgan");
  for (const [href, name] of [
    ["/demo/overview", "Mission Overview"],
    ["/daily-health-check", "Daily Health Check"],
    ["/health-history", "Health History"],
    ["/health-insights", "Health Insights"],
    ["/space-health-knowledge", "Space Health Knowledge"],
    ["/ai-health-assistant", "AI Health Assistant"],
  ]) {
    const menu = page.getByRole("button", {
      name: "Open navigation",
      exact: true,
    });
    if (await menu.isVisible()) await menu.click();
    const link = page
      .locator(".sidebar nav")
      .getByRole("link", { name, exact: true });
    await expect(link).toHaveAttribute("href", href);
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(href + "$"));
    await expect(
      page.getByRole("heading", { name, level: 1, exact: true }),
    ).toBeVisible();
    await expect(page.locator('a[href="/crew-profile"]')).toHaveCount(0);
  }
  expect(await snapshot(page)).toBe(before);
  // The legacy route is deliberately retained, without a normal navigation link.
  await page.goto("/crew-profile");
  await expect(
    page.getByRole("link", { name: "Back to Mission Overview", exact: true }),
  ).toBeVisible();
  await expect(page.locator('a[href="/crew-profile"]')).toHaveCount(0);
});

test("shared premium chart palette keeps points, units, tables and isolated records intact", async ({
  page,
}, info) => {
  await page.goto("/health-history");
  const heart = page.locator('.chart-panel[data-indicator="heartRate"]');
  await expect(heart.locator(".recharts-area-dot")).toHaveCount(14);
  const before = await snapshot(page);
  for (const [key, color] of [
    ["heartRate", "#ff9eaa"],
    ["spo2", "#62e3d4"],
    ["temperature", "#ffc078"],
  ]) {
    const card = page.locator(`.chart-panel[data-indicator="${key}"]`);
    await expect(card.locator(".recharts-area-curve")).toHaveAttribute(
      "stroke",
      color,
    );
    await expect(card.locator(".recharts-area-curve")).toHaveAttribute(
      "stroke-width",
      "3",
    );
    await expect(card.locator(".recharts-area-dot").first()).toHaveAttribute(
      "r",
      "3.5",
    );
    expect(
      await card.evaluate((node) => getComputedStyle(node).borderTopWidth),
    ).toBe("3px");
  }
  const pressure = page.locator('.chart-panel[data-indicator="bloodPressure"]');
  await expect(pressure.locator(".recharts-line-curve").nth(0)).toHaveAttribute(
    "stroke",
    "#9dadff",
  );
  await expect(pressure.locator(".recharts-line-curve").nth(1)).toHaveAttribute(
    "stroke",
    "#f4a6d7",
  );
  await expect(pressure.locator(".recharts-line-curve").nth(1)).toHaveAttribute(
    "stroke-dasharray",
    "5 4",
  );
  await expect(pressure).toContainText(
    "Solid indigo: systolic / Dashed pink: diastolic",
  );
  await expect(
    page
      .locator('[data-indicator="sleep"] .recharts-bar-rectangle path')
      .first(),
  ).toHaveAttribute("fill", "#c3a6ff");
  await heart.locator(".recharts-area-dot").first().hover({ force: true });
  await expect(heart.locator(".recharts-tooltip-wrapper")).toContainText("bpm");
  const tableSummary = heart.locator(".chart-table > summary");
  await tableSummary.focus();
  await page.keyboard.press("Enter");
  await expect(heart.getByRole("table")).toBeVisible();
  await expect(heart.locator("tbody tr")).toHaveCount(14);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("premium-history.png"),
    fullPage: true,
  });
  await page.goto("/health-insights");
  for (const [indicator, name, color] of [
    ["sleep", "Sleep duration", "#c3a6ff"],
    ["fatigue", "Fatigue score", "#ffb49a"],
    ["exercise", "Exercise duration", "#83e1b0"],
  ]) {
    await page
      .getByLabel("Trend indicator", { exact: true })
      .selectOption(indicator);
    const chart = page.getByRole("img", { name: new RegExp(`${name} trend`) });
    await expect(chart.locator(".recharts-line-curve")).toHaveAttribute(
      "stroke",
      color,
    );
    await expect(chart.locator(".recharts-line-curve")).toHaveAttribute(
      "stroke-width",
      "3",
    );
  }
  await expect(page.locator(".indicator-lesson")).toHaveCount(11);
  expect(await snapshot(page)).toBe(before);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("premium-insights.png"),
    fullPage: true,
  });
  // Series contrast uses the darkest/lightest chart surfaces, not medical categories.
  const luminance = (hex: string) =>
    hex
      .match(/[a-f\d]{2}/gi)!
      .map((value) => {
        const n = parseInt(value, 16) / 255;
        return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
      })
      .reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);
  for (const color of [
    "#ff9eaa",
    "#c3a6ff",
    "#62e3d4",
    "#ffc078",
    "#9dadff",
    "#f4a6d7",
    "#ffb49a",
    "#83e1b0",
  ])
    expect(
      (luminance(color) + 0.05) / (luminance("#192b48") + 0.05),
    ).toBeGreaterThanOrEqual(3);
  expect(
    (luminance("#c4d2e5") + 0.05) / (luminance("#192b48") + 0.05),
  ).toBeGreaterThanOrEqual(4.5);
});
