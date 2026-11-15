import { expect, test } from "@playwright/test";

test("shared medical-support and five preventive considerations are accessible, sourced and informational", async ({
  page,
}, info) => {
  for (const route of ["/health-insights", "/space-health-knowledge"]) {
    await page.goto(route);
    const guidance = page.locator(".crew-health-guidance");
    await expect(
      guidance.getByRole("heading", {
        name: "When Should I Ask for Medical Support?",
        exact: true,
      }),
    ).toBeVisible();
    await expect(guidance).toContainText(
      "A personal baseline change alone does not establish a medical emergency.",
    );
    await expect(guidance.locator(".indicator-emergency")).toContainText(
      "does not provide emergency assessment",
    );
    await expect(guidance).toContainText(
      "Communicate self-reported urgent concerns promptly",
    );
    await expect(guidance.locator("button, form, input")).toHaveCount(0);
    await expect(guidance.locator('[role="alert"]')).toHaveCount(0);
    const support = guidance.locator(".crew-support-details > summary");
    await support.focus();
    await page.keyboard.press("Enter");
    await expect(guidance.locator(".crew-support-details")).toHaveAttribute(
      "open",
      "",
    );
    await expect(guidance.locator(".crew-support-details")).toContainText(
      "not an exhaustive checklist or a triage rule",
    );
    await expect(guidance.locator(".crew-support-details")).toContainText(
      "does not place a call, send a message or arrange a consultation",
    );
    await guidance
      .getByRole("link", {
        name: "Explore preventive considerations",
        exact: true,
      })
      .click();
    const prevention = guidance.locator(".crew-prevention > summary");
    await expect(prevention).toBeInViewport();
    await prevention.focus();
    await page.keyboard.press("Enter");
    await expect(guidance.locator(".crew-consideration")).toHaveCount(5);
    for (const id of [
      "rest",
      "activity",
      "food-fluid",
      "wellbeing",
      "monitoring",
    ]) {
      const card = guidance.locator(`[data-consideration="${id}"]`);
      await card.locator("summary").focus();
      await page.keyboard.press("Enter");
      await expect(card.locator("dt")).toHaveCount(4);
      await expect(
        card.getByText("Safe next step · general suggestion", { exact: true }),
      ).toBeVisible();
      for (const source of await card.locator("a").all()) {
        await expect(source).toBeVisible();
        await expect(source).toHaveAttribute("target", "_blank");
        await expect(source).toHaveAttribute("rel", "noreferrer");
      }
    }
    const sources = await guidance
      .locator('a[href^="https://"]')
      .evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLAnchorElement).href).sort(),
      );
    expect(sources).toEqual(
      [
        "https://www.nasa.gov/reference/3-0-health-and-medical-care/",
        "https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/medical-support.asp",
        "https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/",
        "https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/",
        "https://www.nasa.gov/reference/6-0-natural-and-induced-environments-vol-2/",
        "https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/",
        "https://www.nasa.gov/reference/risk-of-behavioral-changes-and-psychiatric-disorders/",
        "https://www.nasa.gov/reference/standard-measures/",
      ].sort(),
    );
    await expect(page.locator(".indicator-lesson")).toHaveCount(11);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(
        route === "/health-insights"
          ? "insights-guidance.png"
          : "knowledge-guidance.png",
      ),
      fullPage: true,
    });
    await guidance
      .getByRole("link", { name: "Review measurement basics", exact: true })
      .click();
    await expect(page.locator("#learn-heart-rate > summary")).toBeInViewport();
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
    await page.setViewportSize(info.project.use.viewport!);
  }
});
