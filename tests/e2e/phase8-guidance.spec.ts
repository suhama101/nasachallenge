import { expect, test } from "@playwright/test";

test("beginner measurement guide is expandable, source-linked and explicit about evidence limits", async ({
  page,
}, testInfo) => {
  await page.goto("/space-health-knowledge");
  const guide = page.locator(".indicator-guide");
  await expect(
    guide.getByRole("heading", { name: "Understand Your Health", exact: true }),
  ).toBeVisible();
  await expect(guide.locator(".indicator-lesson")).toHaveCount(11);
  for (const topic of [
    "Heart rate",
    "Blood pressure",
    "Blood glucose",
    "Body temperature",
    "SpO₂",
    "Sleep",
    "Mood",
    "Fatigue",
    "Exercise",
    "Hydration",
    "Reported symptoms",
  ]) {
    const lesson = guide
      .locator(".indicator-lesson")
      .filter({
        has: page.locator("summary strong", {
          hasText: new RegExp(`^${topic}$`),
        }),
      });
    const summary = lesson.locator("summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(lesson).toHaveAttribute("open", "");
    for (const heading of [
      "WHAT",
      "WHY · GENERAL CONTEXT",
      "HOW · RECORDING GUIDANCE",
      "SPACE CONNECTION · NASA RESEARCH",
      "WHAT NEXT · GENERAL GUIDANCE",
      "WHEN TO SEEK HELP",
      "NASA SOURCE",
    ])
      await expect(
        lesson.locator("dt").filter({ hasText: new RegExp(`^${heading}$`) }),
      ).toBeVisible();
    await expect(lesson.locator(".lesson-help")).toContainText(
      "does not set a personal consultation threshold",
    );
    await expect(lesson.locator(".lesson-source").first()).toHaveAttribute(
      "href",
      /^https:\/\/www\.nasa\.gov\//,
    );
    await expect(lesson.locator(".lesson-attribution")).toContainText(
      "not MissionPulse’s input limits",
    );
    await summary.press("Enter");
  }
  await guide.locator(".guide-research-map > summary").click();
  const sources = await guide
    .locator(".guide-research-map ol a")
    .evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).href),
    );
  expect(sources).toEqual([
    "https://www.nasa.gov/hrp/hazards/",
    "https://www.nasa.gov/hrp/risks/",
    "https://www.nasa.gov/hrp/ongoing-hrp-research/",
    "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp",
    "https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp",
  ]);
  await expect(guide.locator(".indicator-emergency")).toContainText(
    "does not provide emergency assessment",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("measurement-guide.png"),
    fullPage: true,
  });
});

test("insights link to guidance and card hover respects reduced motion", async ({
  page,
}) => {
  await page.goto("/health-insights");
  await page
    .getByRole("link", { name: "What Do My Measurements Mean?", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Understand Your Health", exact: true }),
  ).toBeInViewport();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo/overview");
  const card = page.locator(".journey-card").first();
  await card.hover();
  expect(await card.evaluate((node) => getComputedStyle(node).transform)).toBe(
    "none",
  );
  await card.focus();
  await expect(card).toBeFocused();
  expect(
    await card.evaluate((node) => getComputedStyle(node).outlineStyle),
  ).toBe("solid");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", {
      name: "Daily Health Check",
      level: 1,
      exact: true,
    }),
  ).toBeVisible();
});
