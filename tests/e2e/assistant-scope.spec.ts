import { expect, test } from "@playwright/test";

test("ambiguous chat wording asks for confirmation and unsupported medical questions stay bounded", async ({
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
  await page
    .getByLabel("Use selected demo measurements for this message", {
      exact: true,
    })
    .check();
  async function send(question: string) {
    const count = await page.locator(".chat-assistant").count();
    await page.getByLabel("Your question", { exact: true }).fill(question);
    await page
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    await expect(page.locator(".chat-assistant")).toHaveCount(count + 1);
    return page.locator(".chat-assistant").last();
  }
  let answer = await send("Are you doing chanting?");
  await expect(answer.locator(".answer-direct")).toContainText(
    "Did you mean chatting?",
  );
  await expect(answer).not.toContainText("currently available");
  await expect(answer).toContainText("not live generative AI");
  await expect(answer.locator(".chat-source")).toHaveCount(0);
  await expect(
    page.getByLabel("Use selected demo measurements for this message", {
      exact: true,
    }),
  ).not.toBeChecked();
  answer = await send("yes");
  await expect(answer).toContainText(
    "local research assistant, not unrestricted live generative AI",
  );
  answer = await send("What can you help me with?");
  await expect(answer).toContainText("explicit per-message consent");
  answer = await send("Can sleep cure diabetes?");
  await expect(answer).toContainText(
    "cannot assess a medical condition or recommend treatment",
  );
  await expect(answer.locator(".chat-source")).toHaveCount(0);
  answer = await send("Can chanting improve my sleep?");
  await expect(answer).toContainText("Outside my supported topics");
  await expect(answer).not.toContainText("Did you mean chatting?");
  expect(posts).toBe(0);
  await page
    .getByLabel("Use live Groq selection when relevant", { exact: true })
    .uncheck();
  answer = await send("Why my fatigue?");
  await expect(answer).toContainText("several contributing factors");
  await expect(answer.locator(".chat-source")).toHaveAttribute(
    "href",
    "https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/",
  );
});
