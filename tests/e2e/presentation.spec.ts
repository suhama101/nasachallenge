import { expect, test } from "@playwright/test";

test("new call-to-action and reading surfaces have readable text contrast", async ({
  page,
}) => {
  for (const [route, selectors] of [
    [
      "/welcome",
      [
        ".landing-actions [data-variant=default]",
        ".landing-actions [data-variant=outline]",
        ".landing-signin",
        ".landing-description",
        ".how-grid p",
      ],
    ],
    [
      "/demo/overview",
      [
        ".journey-card",
        ".journey-card p",
        ".journey-card > span",
        ".metric-note",
      ],
    ],
    [
      "/space-health-knowledge",
      [
        ".research-source-grid h3",
        ".research-source-grid p",
        ".source-open",
        ".research-limit p",
        ".reading-guide p",
      ],
    ],
  ] as const) {
    await page.goto(route);
    for (const selector of selectors) {
      const contrast = await page
        .locator(selector)
        .first()
        .evaluate((element) => {
          const rgb = (value: string) => value.match(/[\d.]+/g)!.map(Number);
          const luminance = (color: number[]) =>
            color
              .slice(0, 3)
              .map((value) => {
                const channel = value / 255;
                return channel <= 0.04045
                  ? channel / 12.92
                  : ((channel + 0.055) / 1.055) ** 2.4;
              })
              .reduce(
                (sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i],
                0,
              );
          const foreground = rgb(getComputedStyle(element).color);
          let current: Element | null = element;
          let background = [0, 0, 0, 0];
          while (current && background[3] === 0) {
            background = rgb(getComputedStyle(current).backgroundColor);
            current = current.parentElement;
          }
          const fg = luminance(foreground),
            bg = luminance(background);
          return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
        });
      expect(contrast, `${route} ${selector}`).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test("beginner welcome explains modes and offers working account and demo entry", async ({
  page,
}) => {
  await page.goto("/welcome");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Your Health Companion, Beyond Earth.",
  );
  await expect(
    page.getByRole("heading", { name: "Astronaut Mode", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Explore Demo", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".how-grid > li")).toHaveCount(4);
  await expect(page.locator(".landing-disclaimer")).toContainText(
    "Not an operational NASA healthcare system",
  );
  expect(
    await page.evaluate(async () =>
      (await indexedDB.databases()).some((db) =>
        db.name?.includes("missionpulse"),
      ),
    ),
  ).toBe(false);
  await expect(
    page.getByRole("link", { name: "Create Account", exact: true }),
  ).toHaveAttribute("href", "/auth/signup");
  await expect(
    page.getByRole("link", { name: "Sign In", exact: true }),
  ).toHaveAttribute("href", "/auth/login");
  await page.getByRole("link", { name: "Create Account", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/signup$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/welcome");
  await page.getByRole("link", { name: "Try Interactive Demo" }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("plain-English action cards reach existing functional demo pages", async ({
  page,
}) => {
  const destinations = [
    {
      action: "Start Daily Check-In",
      path: "/daily-health-check",
      title: "Daily Health Check",
    },
    {
      action: "View My Records",
      path: "/health-history",
      title: "Health History",
    },
    {
      action: "See Health Trends",
      path: "/health-insights",
      title: "Health Insights",
    },
  ];
  for (const destination of destinations) {
    await page.goto("/demo/overview");
    const card = page
      .locator(".journey-card")
      .filter({ hasText: destination.action });
    await expect(card).toHaveAttribute("href", destination.path);
    await card.click();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: destination.title,
        exact: true,
      }),
    ).toBeVisible();
  }
  await page.goto("/demo/overview");
  await page
    .locator(".journey-secondary")
    .getByRole("link", { name: "Space Health Guide" })
    .click();
  await expect(page).toHaveURL(/\/space-health-knowledge$/);
  await expect(page.locator(".research-source-grid > a")).toHaveCount(5);
  const links = await page
    .locator(".research-source-grid > a")
    .evaluateAll((anchors) =>
      anchors.map((a) => (a as HTMLAnchorElement).href),
    );
  expect(links).toEqual([
    "https://www.nasa.gov/hrp/hazards/",
    "https://www.nasa.gov/hrp/risks/",
    "https://www.nasa.gov/hrp/research/",
    "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp",
    "https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp",
  ]);
  await expect(page.locator(".research-limit")).toContainText(
    "do not provide individual measurement thresholds",
  );
});

test("new presentation fits the viewport and supports keyboard focus and reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of [
    "/welcome",
    "/",
    "/daily-health-check",
    "/health-history",
    "/health-insights",
    "/space-health-knowledge",
  ]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route,
    ).toBe(true);
  }
  await page.goto("/welcome");
  const demo = page.getByRole("link", { name: "Try Interactive Demo" });
  await demo.focus();
  await expect(demo).toBeFocused();
  expect(
    await demo.evaluate((node) => getComputedStyle(node).outlineStyle),
  ).toBe("solid");
  expect(
    await demo.evaluate((node) => getComputedStyle(node).transitionDuration),
  ).toBe("0s");
  expect((await demo.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/demo$/);
});
