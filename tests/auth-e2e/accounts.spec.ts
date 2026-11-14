import { expect, test, type Page } from "@playwright/test";
const fixture = "http://127.0.0.1:4400";
test.beforeEach(async ({ request }) => {
  await request.post(`${fixture}/__fixture/reset`);
});
async function signIn(page: Page, email = "fixture-a@example.invalid") {
  await page.goto("/auth/login");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("fictional-passphrase");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
}
test("mocked SSR: signup validation, verification help, generic email and reset screens", async ({
  page,
}) => {
  await page.goto("/auth/signup");
  await page
    .getByRole("button", { name: "Create Account", exact: true })
    .click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "highlighted fields",
  );
  await page
    .getByLabel("Email address", { exact: true })
    .fill("new-fixture@example.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fictional-passphrase");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("fictional-passphrase");
  await page
    .getByRole("button", { name: "Create Account", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "If this address is eligible",
  );
  await page.goto("/auth/forgot-password");
  await page.getByLabel("Email address").fill("unknown@example.invalid");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText(
    "If this address is eligible",
  );
  await page.goto("/auth/verify-email");
  await expect(
    page.getByRole("heading", { name: "Check your email" }),
  ).toBeVisible();
  await page.goto("/auth/update-password");
  await expect(page.locator("main [role=alert]")).toContainText("expired");
  await expect(
    page.getByRole("button", { name: "Save new password" }),
  ).toBeDisabled();
});
test("mocked SSR: protected routes, invalid login and unverified email never show personal or demo records", async ({
  page,
}) => {
  await page.goto("/astronaut/profile");
  await expect(page).toHaveURL(/auth\/login\?reason=session/);
  await page.getByLabel("Email address").fill("unknown@example.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fictional-passphrase");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "could not sign you in",
  );
  await signIn(page, "unverified@example.invalid");
  await expect(page).toHaveURL(/auth\/verify-email$/);
  await page.goto("/astronaut");
  await expect(page).toHaveURL(/auth\/verify-email$/);
  await expect(page.getByText("Alex Morgan", { exact: false })).toHaveCount(0);
});
test("mocked SSR: onboarding, editing, session persistence, logout and another owner stay isolated", async ({
  page,
  browser,
}, testInfo) => {
  await signIn(page);
  await expect(page).toHaveURL(/astronaut\/onboarding$/);
  await expect(page.getByText("Alex Morgan", { exact: false })).toHaveCount(0);
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
  await page.getByRole("button", { name: "Save profile and continue" }).click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "highlighted fields",
  );
  await page.getByLabel("Display name", { exact: false }).fill("Fixture A");
  await page.getByLabel("Crew ID", { exact: false }).fill("TEST-A");
  await page
    .getByLabel("Mission name", { exact: false })
    .fill("Private A mission");
  await page.getByRole("button", { name: "Save profile and continue" }).click();
  await expect(page.locator("#profile-environment-error")).toBeVisible();
  await expect(page.getByLabel("Mission name", { exact: false })).toHaveValue(
    "Private A mission",
  );
  await expect(
    page.getByRole("button", { name: "Save profile and continue" }),
  ).toBeEnabled();
  await page
    .getByLabel("Mission environment", { exact: false })
    .selectOption("space-station");
  await expect(
    page.getByLabel("Mission environment", { exact: false }),
  ).toHaveValue("space-station");
  await page.getByRole("button", { name: "Save profile and continue" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Fixture A" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Private A mission", { exact: true }),
  ).toBeVisible();
  await page.goto(
    "/astronaut/profile?user_id=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  );
  await expect(page.getByLabel("Display name", { exact: false })).toHaveValue(
    "Fixture A",
  );
  await page.getByLabel("Role (optional)").fill("Simulation specialist");
  await page.getByRole("button", { name: "Save profile changes" }).click();
  await expect(
    page.getByText("Simulation specialist", { exact: true }),
  ).toBeVisible();
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await signIn(otherPage, "fixture-b@example.invalid");
  await expect(
    otherPage.getByRole("heading", { name: "Welcome, Fixture B" }),
  ).toBeVisible();
  await expect(
    otherPage.getByText("Private A mission", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Private B mission", { exact: true }),
  ).toHaveCount(0);
  await other.close();
  await page.goto("/astronaut/daily-health-check");
  await expect(
    page.getByRole("button", { name: "Save personal check-in", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save demo check-in" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("astronaut-workspace.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await expect(page).toHaveURL(/auth\/login\?reason=signed-out/);
  await page.goto("/astronaut/profile");
  await expect(page).toHaveURL(/auth\/login\?reason=session/);
});
test("mocked SSR: verification callback strips tokens and recovery requires a valid session", async ({
  page,
}) => {
  await page.goto(
    "/auth/callback?token_hash=fictional-verification&type=signup&next=https://evil.invalid",
  );
  await expect(page).toHaveURL(/astronaut\/onboarding$/);
  expect(page.url()).not.toContain("token_hash");
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await expect(page).toHaveURL(/auth\/login/);
  await page.goto("/auth/callback?token_hash=fictional-recovery&type=recovery");
  await expect(page).toHaveURL(/auth\/update-password$/);
  await page
    .getByLabel("New password", { exact: true })
    .fill("new-fictional-passphrase");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("new-fictional-passphrase");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page).toHaveURL(/auth\/login\?reason=password-updated/);
  await page
    .getByLabel("Email address", { exact: true })
    .fill("fixture-a@example.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("new-fictional-passphrase");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/astronaut\/onboarding$/);
});
test("mocked SSR: an expired session cannot reopen private routes", async ({
  page,
  request,
}) => {
  await signIn(page, "fixture-b@example.invalid");
  await expect(
    page.getByRole("heading", { name: "Welcome, Fixture B" }),
  ).toBeVisible();
  await request.post(`${fixture}/__fixture/expire`);
  await page.goto("/astronaut/profile").catch((error) => {
    if (!String(error).includes("ERR_ABORTED")) throw error;
  });
  await expect(page).toHaveURL(/auth\/login\?reason=session/);
  await expect(
    page.getByText("Private B mission", { exact: true }),
  ).toHaveCount(0);
});
test("mocked SSR: sign out clears a second tab and browser back cannot restore the private workspace", async ({
  page,
  context,
}) => {
  await signIn(page, "fixture-b@example.invalid");
  await expect(
    page.getByRole("heading", { name: "Welcome, Fixture B" }),
  ).toBeVisible();
  const second = await context.newPage();
  const sessionReady = second.waitForResponse(
    (response) =>
      response.url().endsWith("/auth/session") && response.status() === 200,
  );
  await second.goto("/astronaut");
  await sessionReady;
  await expect(
    second.getByRole("heading", { name: "Welcome, Fixture B" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await expect(page).toHaveURL(/auth\/login\?reason=signed-out/);
  await second.bringToFront();
  await expect(second).toHaveURL(/auth\/login\?reason=session/);
  await page.goBack();
  await expect(page).toHaveURL(/auth\/login/);
  await expect(
    page.getByText("Private B mission", { exact: true }),
  ).toHaveCount(0);
  await second.close();
});
