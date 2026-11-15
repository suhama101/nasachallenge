import { expect, test, type Page } from "@playwright/test";

async function send(page: Page, question: string) {
  const count = await page.locator(".chat-assistant").count();
  await page.getByLabel("Your question", { exact: true }).fill(question);
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".chat-assistant")).toHaveCount(count + 1);
  return page.locator(".chat-assistant").last();
}
async function snapshot(page: Page) {
  return page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const request = indexedDB.open("missionpulse-demo-v1", 1);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("checkIns", "readonly");
          const read = tx.objectStore("checkIns").getAll();
          read.onsuccess = () => resolve(JSON.stringify(read.result));
          read.onerror = () => reject(Error("Snapshot failed"));
          tx.oncomplete = () => db.close();
        };
        request.onerror = () => reject(Error("Snapshot failed"));
      }),
  );
}

test("direct answers, relevant citations, local follow-ups and spelling variations", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/ai-health-assistant");
  await expect(
    page.getByRole("button", { name: "Send message", exact: true }),
  ).toBeDisabled();
  let answer = await send(page, "Why my fatigue?");
  await expect(answer.locator(".answer-direct")).toContainText(
    "several contributing factors",
  );
  await expect(answer).toContainText("I have not read your measurements");
  await expect(answer.locator(".chat-source")).toHaveCount(1);
  await expect(answer.locator(".chat-source")).toHaveAttribute(
    "href",
    "https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/",
  );
  answer = await send(page, "What should I record if I feel dizzy?");
  await expect(answer.locator(".answer-direct")).toContainText(
    "when the dizziness began",
  );
  await expect(answer).toContainText("how long it lasted");
  await expect(answer).not.toContainText(/radiation|hostile environments/i);
  await expect(answer.locator(".chat-source")).toHaveCount(1);
  await expect(answer.locator(".chat-source")).toHaveAttribute(
    "href",
    "https://www.nasa.gov/reference/risk-of-altered-sensorimotor-and-vestibular-function/",
  );
  await answer.screenshot({
    path: testInfo.outputPath("focused-dizziness.png"),
  });
  await send(page, "What does NASA say about cardiovascular changes?");
  answer = await send(page, "Tell me more");
  await expect(answer.locator(".answer-direct")).toContainText("circulation");
  await expect(answer.locator(".chat-source")).toHaveCount(1);
  answer = await send(page, "Why my fatiuge?");
  await expect(answer.locator(".answer-direct")).toContainText(
    "several contributing factors",
  );
  answer = await send(page, "Why can microgravity affect bones?");
  await expect(answer.locator(".answer-direct")).toContainText(
    "reduced loading",
  );
  answer = await send(page, "Explain quasar algebra");
  await expect(answer).toContainText("Outside my supported topics");
  await expect(answer.locator(".chat-source")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".chat-assistant")).toHaveCount(7);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("record consent resets for follow-ups and scenario analysis preserves saved records", async ({
  page,
}) => {
  await page.goto("/ai-health-assistant");
  await send(page, "Has my sleep decreased?");
  const before = await snapshot(page);
  await page
    .getByLabel("Assistant dataset", { exact: false })
    .selectOption("sleep-fatigue");
  const consent = page.getByLabel(
    "Use selected demo measurements for this message",
    { exact: true },
  );
  await consent.check();
  let answer = await send(page, "How has my sleep changed over seven days?");
  await expect(answer.locator(".answer-recorded > p")).toContainText(
    "Arithmetic mean:",
  );
  await expect(answer.locator(".answer-recorded > p")).toContainText("(n=7)");
  await expect(consent).not.toBeChecked();
  await answer
    .getByText("Recorded values & calculation details", { exact: true })
    .click();
  await expect(answer.locator(".answer-recorded details")).toContainText(
    "Synthetic demo",
  );
  answer = await send(page, "And over thirty days?");
  await expect(answer).toContainText("Selected-record consent is required");
  await expect(answer.locator(".answer-recorded")).toHaveCount(0);
  await consent.check();
  answer = await send(page, "Which measurements are missing?");
  await expect(answer.locator(".answer-recorded > p")).toContainText(
    "indicator-day cells",
  );
  expect(await snapshot(page)).toBe(before);
  await page
    .getByLabel("Assistant dataset", { exact: false })
    .selectOption("saved");
  await expect(page.locator(".chat-assistant")).toHaveCount(1);
  await expect(consent).not.toBeChecked();
  expect(await snapshot(page)).toBe(before);
});

test("empty isolated demo history stays missing and no-key mode stays local", async ({
  page,
}) => {
  let posts = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/api/assistant"))
      posts++;
  });
  await page.goto("/ai-health-assistant");
  await send(page, "What does NASA say about sleep?");
  // This Playwright context owns a fresh fictional demo database only.
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("missionpulse-demo-v1", 1);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("checkIns", "readwrite");
          tx.objectStore("checkIns").clear();
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(Error("Isolated empty fixture failed"));
        };
      }),
  );
  await page.reload();
  await page
    .getByLabel("Use selected demo measurements for this message", {
      exact: true,
    })
    .check();
  let answer = await send(page, "How has my sleep changed over seven days?");
  await expect(answer.locator(".answer-recorded > p")).toContainText(
    "Not recorded",
  );
  await page
    .getByLabel("Use selected demo measurements for this message", {
      exact: true,
    })
    .check();
  answer = await send(page, "Which measurements are missing?");
  await expect(answer.locator(".answer-recorded > p")).toContainText("0 of 63");
  await expect(answer).toContainText("not live AI");
  expect(posts).toBe(0);
});
