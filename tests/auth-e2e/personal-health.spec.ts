import { expect, test, type Page } from "@playwright/test";
const fixture = "http://127.0.0.1:4400";
test.beforeEach(async ({ request }) => {
  await request.post(`${fixture}/__fixture/reset`);
});
async function login(page: Page, email = "fixture-b@example.invalid") {
  await page.goto("/auth/login");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("fictional-passphrase");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
}
async function fill(page: Page) {
  for (const [label, value] of [
    ["Resting heart rate", "79"],
    ["Systolic blood pressure", "120"],
    ["Diastolic blood pressure", "80"],
    ["Body temperature", "36.8"],
    ["Sleep duration", "7.5"],
    ["Exercise duration", "30"],
  ])
    await page.getByLabel(label, { exact: false }).fill(value);
  await page.getByLabel("Mood", { exact: false }).selectOption("calm");
  await page.getByLabel("Fatigue level", { exact: false }).selectOption("3");
  await page
    .getByLabel("Notes", { exact: false })
    .fill("Fictional personal-health browser fixture only.");
}
async function saveOne(page: Page) {
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Welcome, Fixture B" }),
  ).toBeVisible();
  await page.goto("/astronaut/daily-health-check");
  await fill(page);
  await page
    .getByRole("button", { name: "Save personal check-in", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Personal check-in saved" }),
  ).toBeVisible();
}
test("personal cloud mock: validation, optional nulls, duplicate guard, reload, confirmed edit/delete preserve identity", async ({
  page,
  request,
}, testInfo) => {
  await login(page);
  await expect(page.locator(".overview-status")).toContainText("0 saved check-ins");
  await expect(page.locator(".records-empty")).toHaveCount(0);
  await page.goto("/astronaut/health-history");
  await expect(
    page.getByRole("heading", {
      name: "Your history starts with one check-in",
    }),
  ).toBeVisible();
  await page.goto("/astronaut/daily-health-check");
  await fill(page);
  const oxygen = page.getByLabel("Blood oxygen saturation", { exact: false });
  await oxygen.fill("0");
  await page
    .getByRole("button", { name: "Save personal check-in", exact: true })
    .click();
  await expect(page.locator("#spo2-error")).toContainText(
    "Zero is not accepted",
  );
  await expect(
    page.getByLabel("Resting heart rate", { exact: false }),
  ).toHaveValue("79");
  expect(
    await request.get(`${fixture}/__fixture/records`).then((r) => r.json()),
  ).toHaveLength(0);
  await oxygen.fill("");
  await page.locator("form.health-form").evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
    (form as HTMLFormElement).requestSubmit();
  });
  await expect(
    page.getByRole("heading", { name: "Personal check-in saved" }),
  ).toBeVisible();
  const initial = await request
    .get(`${fixture}/__fixture/records`)
    .then((r) => r.json());
  expect(initial).toHaveLength(1);
  expect(initial[0]).toMatchObject({
    spo2: null,
    glucose: null,
    water: null,
    data_source: "user-entered",
    astronaut_profile_id: "22222222-2222-4222-8222-222222222222",
  });
  await page
    .getByRole("link", { name: "View Health History", exact: true })
    .click();
  await expect(page.locator(".checkin-details")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".checkin-details")).toHaveCount(1);
  await page.locator(".checkin-details summary").click();
  await expect(page.locator(".checkin-details")).toContainText("Not recorded");
  await expect(page.locator(".checkin-details")).not.toContainText(
    "Fictional profile AST-0042",
  );
  await page
    .getByRole("button", { name: "Edit check-in", exact: true })
    .click();
  await page.getByLabel("Resting heart rate", { exact: false }).fill("81");
  await page
    .getByRole("button", { name: "Save check-in changes", exact: true })
    .click();
  await expect(page.locator(".validation-summary")).toContainText(
    "confirmation checkbox",
  );
  await expect(
    page.getByLabel("Resting heart rate", { exact: false }),
  ).toHaveValue("81");
  await page
    .getByRole("checkbox", {
      name: "I have reviewed these changes",
      exact: false,
    })
    .check();
  await page
    .getByRole("button", { name: "Save check-in changes", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Your check-in changes were saved." }),
  ).toBeVisible();
  const edited = await request
    .get(`${fixture}/__fixture/records`)
    .then((r) => r.json());
  expect(edited[0].heart_rate).toBe(81);
  for (const key of [
    "id",
    "astronaut_profile_id",
    "recorded_at",
    "created_at",
    "data_source",
  ])
    expect(edited[0][key]).toEqual(initial[0][key]);
  expect(edited[0].updated_at).not.toEqual(initial[0].updated_at);
  await page
    .getByRole("button", { name: "Delete check-in", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Keep check-in", exact: true })
    .click();
  await expect(page.locator(".checkin-details")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator(".chart-source").first()).toContainText(
    "Manually entered personal records",
  );
  await page.screenshot({
    path: testInfo.outputPath("personal-history.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Delete check-in", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete this check-in", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Your history starts with one check-in",
    }),
  ).toBeVisible();
  expect(
    await request.get(`${fixture}/__fixture/records`).then((r) => r.json()),
  ).toHaveLength(0);
});
test("personal cloud mock: connection failures and stale edits keep entered values without inventing success", async ({
  page,
  request,
}) => {
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Welcome, Fixture B" }),
  ).toBeVisible();
  await page.goto("/astronaut/daily-health-check");
  await fill(page);
  await request.post(`${fixture}/__fixture/health-failure`, {
    data: { enabled: true },
  });
  await page
    .getByRole("button", { name: "Save personal check-in", exact: true })
    .click();
  await expect(page.locator(".validation-summary")).toContainText(
    "could not be saved",
  );
  await expect(
    page.getByLabel("Resting heart rate", { exact: false }),
  ).toHaveValue("79");
  await expect(
    page.getByRole("heading", { name: "Personal check-in saved" }),
  ).toHaveCount(0);
  await request.post(`${fixture}/__fixture/health-failure`, {
    data: { enabled: false },
  });
  await page
    .getByRole("button", { name: "Save personal check-in", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Personal check-in saved" }),
  ).toBeVisible();
  await page.goto("/astronaut/health-history");
  await page
    .getByRole("button", { name: "Edit check-in", exact: true })
    .click();
  await page.getByLabel("Resting heart rate", { exact: false }).fill("82");
  await page
    .getByRole("checkbox", {
      name: "I have reviewed these changes",
      exact: false,
    })
    .check();
  const [original] = await request
    .get(`${fixture}/__fixture/records`)
    .then((r) => r.json());
  await request.post(`${fixture}/__fixture/touch-record`, {
    data: { id: original.id },
  });
  await page
    .getByRole("button", { name: "Save check-in changes", exact: true })
    .click();
  await expect(page.locator(".validation-summary")).toContainText(
    "may have changed",
  );
  await expect(
    page.getByLabel("Resting heart rate", { exact: false }),
  ).toHaveValue("82");
  const [after] = await request
    .get(`${fixture}/__fixture/records`)
    .then((r) => r.json());
  expect(after.heart_rate).toBe(79);
  expect(after.notes).toBe("Fictional concurrent edit.");
});
test("personal cloud mock: another account and Explore Demo never receive private check-ins", async ({
  page,
  browser,
  request,
}) => {
  await saveOne(page);
  const original = await request
    .get(`${fixture}/__fixture/records`)
    .then((r) => r.json());
  await page.goto("/demo");
  await page.goto("/health-history");
  await expect(page.locator(".checkin-details")).toHaveCount(14);
  await expect(
    page.getByText("Fictional personal-health browser fixture only.", {
      exact: true,
    }),
  ).toHaveCount(0);
  await page.goto("/astronaut/health-history");
  await expect(page.locator(".checkin-details")).toHaveCount(1);
  expect(
    await request.get(`${fixture}/__fixture/records`).then((r) => r.json()),
  ).toEqual(original);
  const other = await browser.newContext();
  const a = await other.newPage();
  await login(a, "fixture-a@example.invalid");
  await expect(a).toHaveURL(/astronaut\/onboarding/);
  await a.getByLabel("Display name", { exact: false }).fill("Fixture A");
  await a.getByLabel("Crew ID", { exact: false }).fill("TEST-A");
  await a
    .getByLabel("Mission name", { exact: false })
    .fill("Separate A mission");
  await a
    .getByLabel("Mission environment", { exact: false })
    .selectOption("other");
  await a.getByRole("button", { name: "Save profile and continue" }).click();
  await expect(a.locator(".overview-status")).toContainText("0 saved check-ins");
  await expect(a.locator(".records-empty")).toHaveCount(0);
  await a.goto(
    "/astronaut/health-history?profileId=22222222-2222-4222-8222-222222222222",
  );
  await expect(
    a.getByRole("heading", { name: "Your history starts with one check-in" }),
  ).toBeVisible();
  await expect(a.locator(".checkin-details")).toHaveCount(0);
  await expect(
    a.getByText("Fictional personal-health browser fixture only.", {
      exact: true,
    }),
  ).toHaveCount(0);
  await other.close();
});
test("personal cloud mock: owned baselines, missing oxygen, research links and urgent self-reports", async ({
  page,
  request,
}, testInfo) => {
  const now = new Date();
  const profileId = "22222222-2222-4222-8222-222222222222";
  const records = Array.from({ length: 6 }, (_, index) => {
    const day = new Date(now.getTime() - (5 - index) * 86400000);
    return {
      id: crypto.randomUUID(),
      astronaut_profile_id: profileId,
      mission_local_date: day.toISOString().slice(0, 10),
      recorded_at: day.toISOString(),
      created_at: day.toISOString(),
      updated_at: day.toISOString(),
      heart_rate: index === 5 ? 92 : 70,
      systolic: 120,
      diastolic: 80,
      temperature: 36.8,
      spo2: index === 5 ? null : 98,
      glucose: null,
      water: null,
      sleep: index === 5 ? 4.5 : 7.5,
      exercise: 30,
      mood: "calm",
      fatigue: index === 5 ? 7 : 3,
      symptoms: [],
      notes: "Fictional baseline fixture only.",
      urgent_symptom_reported: false,
      data_source: "user-entered",
    };
  });
  await request.post(`${fixture}/__fixture/health-data`, { data: { records } });
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Welcome, Fixture B" }),
  ).toBeVisible();
  await page.goto("/astronaut/health-insights");
  await page.locator(".insights-advanced > summary").click();
  await expect(page.locator(".baseline-table tbody tr").first()).toContainText(
    "70 bpm",
  );
  await expect(
    page.locator(".baseline-table tbody tr").filter({ hasText: "SpO" }),
  ).toContainText("Not recorded");
  await expect(
    page.getByRole("heading", { name: "Space health research context" }),
  ).toBeVisible();
  await expect(
    page.locator('.reference-card a[href^="https://www.nasa.gov/"]').first(),
  ).toBeVisible();
  await expect(
    page.getByLabel("Analysis dataset", { exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("personal-insights.png"),
    fullPage: true,
  });
  await expect(
    page.locator('.reference-card a[href^="https://www.asc-csa.gc.ca/"]'),
  ).toBeVisible();
  records[5].urgent_symptom_reported = true;
  await request.post(`${fixture}/__fixture/health-data`, {
    data: { records: [records[5]] },
  });
  await page.reload();
  await expect(page.locator(".urgent-insight")).toContainText(
    "No approved medical escalation protocol",
  );
});
