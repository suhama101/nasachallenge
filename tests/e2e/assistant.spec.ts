import { expect, test, type Page } from "@playwright/test";
import { answerLocally } from "../../src/lib/assistant/answers";
const localAnswer = () =>
  answerLocally({
    question: "Explain cardiovascular adaptations",
    dataset: "saved",
    records: [],
    asOf: new Date().toISOString(),
    minBaseline: 5,
    useRecords: false,
  });
async function send(page: Page, question: string) {
  const count = await page.locator(".chat-assistant").count();
  await page.getByLabel("Your question", { exact: true }).fill(question);
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".chat-assistant")).toHaveCount(count + 1);
}
test("knowledge search, topic filters, official sources and responsive layout", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/space-health-knowledge");
  await expect(
    page.getByRole("heading", { name: "Space Health Knowledge", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search approved topics").fill("CANS neutron");
  await expect(page.locator(".knowledge-card").first()).toContainText(
    "Radiation exposure monitoring",
  );
  await page
    .getByRole("link", { name: "Explore Radiation exposure monitoring" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Radiation exposure monitoring",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open official resource" }),
  ).toHaveAttribute(
    "href",
    "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp",
  );
  await expect(page.getByText("2026-11-14", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "All knowledge topics" }).click();
  await page
    .getByLabel("Topic", { exact: true })
    .selectOption("Behavior and sleep");
  await expect(page.locator(".knowledge-card")).toHaveCount(3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("knowledge.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("local consent, persistent history, scoped scenarios, clear confirmation and urgent fallback", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let posts = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/assistant") && request.method() === "POST")
      posts++;
  });
  await page.goto("/ai-health-assistant");
  await send(page, "How many hours did I sleep yesterday?");
  await expect(
    page.getByRole("heading", { name: "Selected-record consent is required" }),
  ).toBeVisible();
  await page
    .getByLabel("Use selected demo measurements for this message", {
      exact: true,
    })
    .check();
  await send(page, "How many hours did I sleep yesterday?");
  await expect(
    page.getByRole("heading", {
      name: "Recorded demonstration values · Sleep duration",
    }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Use selected demo measurements for this message", {
      exact: true,
    }),
  ).not.toBeChecked();
  expect(posts).toBe(0);
  await page.reload();
  await expect(page.locator(".chat-assistant")).toHaveCount(2);
  await page
    .getByLabel("Assistant dataset", { exact: false })
    .selectOption("sleep-fatigue");
  await expect(page.locator(".chat-assistant")).toHaveCount(0);
  await page
    .getByLabel("Use selected demo measurements for this message", {
      exact: true,
    })
    .check();
  await send(page, "Explain my sleep and fatigue baseline");
  await expect(page.locator(".answer-observation").first()).toBeVisible();
  await page
    .getByLabel("Assistant dataset", { exact: false })
    .selectOption("saved");
  await expect(page.locator(".chat-assistant")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Clear conversation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Keep conversation", exact: true })
    .click();
  await expect(page.locator(".chat-assistant")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Clear conversation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete conversation", exact: true })
    .click();
  await expect(page.locator(".chat-assistant")).toHaveCount(0);
  await send(page, "I have chest pain and cannot breathe");
  await expect(page.locator(".answer-safety")).toContainText(
    "designated crew medical officer",
  );
  expect(posts).toBe(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("assistant.png"),
    fullPage: true,
  });
  await page
    .getByLabel("Assistant dataset", { exact: false })
    .selectOption("sleep-fatigue");
  await expect(page.locator(".chat-assistant")).toHaveCount(1);
  expect(errors).toEqual([]);
});
test("live requests disclose only opted-in context and failures keep grounded fallback", async ({
  page,
}) => {
  const bodies: Record<string, unknown>[] = [];
  await page.route("**/api/assistant", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { liveAvailable: true } });
    bodies.push(route.request().postDataJSON());
    return route.fulfill({ json: localAnswer() });
  });
  await page.goto("/ai-health-assistant");
  await page
    .getByLabel("Use live Groq selection when relevant", { exact: true })
    .check();
  await send(page, "Explain cardiovascular adaptations");
  expect(bodies).toHaveLength(1);
  expect(bodies[0].health).toBeUndefined();
  expect(bodies[0].healthConsent).toBe(false);
  await page
    .getByLabel("Assistant dataset", { exact: false })
    .selectOption("heart-rate");
  await page
    .getByLabel("Use live Groq selection when relevant", { exact: true })
    .check();
  await page
    .getByLabel("Use selected demo measurements for this message", {
      exact: true,
    })
    .check();
  await send(page, "Explain my heart rate and sleep baseline");
  expect(bodies).toHaveLength(2);
  const payload = JSON.stringify(bodies[1]);
  expect(payload).toContain("heart-rate");
  expect(payload).not.toContain("notes");
  expect(payload).not.toContain("profileId");
  expect(payload).not.toContain("messages");
  expect(payload).not.toContain("glucose");
  await expect(
    page.getByLabel("Use selected demo measurements for this message", {
      exact: true,
    }),
  ).not.toBeChecked();
  await page.unroute("**/api/assistant");
  await page.route("**/api/assistant", (route) => route.abort());
  await send(page, "Explain cardiovascular adaptations");
  await expect(
    page.locator(".assistant-composer [role='alert']"),
  ).toContainText("Live request unavailable");
  await expect(page.locator(".chat-assistant").last()).toContainText(
    "Grounded fallback used",
  );
  await send(page, "I have chest pain");
  expect(bodies).toHaveLength(2);
  await expect(page.locator(".chat-assistant").last()).toContainText(
    "established mission emergency",
  );
});
