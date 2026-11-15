import { expect, test } from "@playwright/test";

test("introduction FAQ is local, accurate, private and preserves focused health answers", async ({
  page,
}) => {
  let posts = 0;
  await page.route("**/api/assistant", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { liveAvailable: true } });
    posts++;
    return route.abort();
  });
  await page.goto("/ai-health-assistant");
  const live = page.getByLabel("Use live Groq selection when relevant", {
    exact: true,
  });
  await expect(live).toBeEnabled();
  await live.check();
  for (const [question, expected] of [
    [
      "Are we doing live chatting?",
      "local research assistant, not unrestricted live generative AI",
    ],
    ["Are you an AI?", "not a human or an official NASA medical assistant"],
    ["Can you answer my questions?", "supported measurement questions"],
    ["What can you do?", "explicit per-message consent"],
    ["Are you connected to NASA?", "not connected to NASA systems"],
    [
      "Do you have access to my health records?",
      "I have not read any measurements",
    ],
    ["Are we doing live chating?", "not unrestricted live generative AI"],
  ]) {
    const count = await page.locator(".chat-assistant").count();
    if (question.includes("health records"))
      await page
        .getByLabel("Use selected demo measurements for this message", {
          exact: true,
        })
        .check();
    await page.getByLabel("Your question", { exact: true }).fill(question);
    await page
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    await expect(page.locator(".chat-assistant")).toHaveCount(count + 1);
    const answer = page.locator(".chat-assistant").last();
    await expect(answer).toContainText(expected);
    await expect(answer).not.toContainText("No relevant curated evidence");
    await expect(answer).toContainText("not live AI");
    await expect(
      page.getByLabel("Use selected demo measurements for this message", {
        exact: true,
      }),
    ).not.toBeChecked();
  }
  expect(posts).toBe(0);
  await live.uncheck();
  await page
    .getByLabel("Your question", { exact: true })
    .fill("Why my fatigue?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".chat-assistant").last()).toContainText(
    "several contributing factors",
  );
  await expect(
    page.locator(".chat-assistant").last().locator(".chat-source"),
  ).toHaveAttribute(
    "href",
    "https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/",
  );
});

test("equivalent conversational questions render consistent bounded FAQ answers", async ({
  page,
}) => {
  let posts = 0;
  await page.route("**/api/assistant", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { liveAvailable: true } });
    posts++;
    return route.abort();
  });
  await page.goto("/ai-health-assistant");
  await page
    .getByLabel("Use live Groq selection when relevant", { exact: true })
    .check();
  const directChat =
    "You are chatting with MissionPulse's local research assistant, not unrestricted live generative AI. I provide curated NASA/CSA educational answers and can review selected demo measurements with your permission.";
  for (const [question, expected] of [
    ["Are you live chatting?", directChat],
    ["Are you live chating with me?", directChat],
    ["Are we chatting live?", directChat],
    ["Are we doing live chatting?", directChat],
    ["arewe doing live chating", directChat],
    ["Are you a real AI?", "not a human or an official NASA medical assistant"],
    ["What can you do?", "explicit per-message consent"],
    ["AREYOU LIVE CHATING WITHME?!", directChat],
  ]) {
    const count = await page.locator(".chat-assistant").count();
    await page.getByLabel("Your question", { exact: true }).fill(question);
    await page
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    await expect(page.locator(".chat-assistant")).toHaveCount(count + 1);
    const answer = page.locator(".chat-assistant").last();
    if (expected === directChat)
      await expect(answer.locator(".answer-direct > p")).toHaveText(expected);
    else
      await expect(answer.locator(".answer-direct > p")).toContainText(
        expected,
      );
    await expect(answer).not.toContainText("Outside my supported topics");
    await expect(answer.locator(".chat-source")).toHaveCount(0);
    await expect(answer).toContainText("not live AI");
  }
  expect(posts).toBe(0);
});
