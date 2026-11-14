import { expect, test, type Page } from "@playwright/test";
const fixture = "http://127.0.0.1:4400";
test.beforeEach(async ({ request }) => {
  await request.post(`${fixture}/__fixture/reset`);
});
async function login(page: Page) {
  await page.goto("/auth/login");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("fixture-b@example.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fictional-passphrase");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Fixture B" }),
  ).toBeVisible();
}
test("valid SSR session survives protected reload, browser restart and access-token refresh", async ({
  page,
  context,
  browser,
  request,
}) => {
  await login(page);
  await page.goto("/astronaut/health-history");
  await expect(
    page.getByRole("heading", {
      name: "Your history starts with one check-in",
    }),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/astronaut\/health-history$/);
  await expect(
    page.getByRole("heading", {
      name: "Your history starts with one check-in",
    }),
  ).toBeVisible();
  const sessionCookie = (await context.cookies()).find((cookie) =>
    /-auth-token$/.test(cookie.name),
  );
  expect(sessionCookie).toBeDefined();
  expect(sessionCookie!.expires).toBeGreaterThan(Date.now() / 1000);
  const expired = await request
    .post(`${fixture}/__fixture/expired-access`)
    .then((r) => r.json());
  // Fictional session only; no credential values or browser state are logged.
  expired.user.user_metadata = { fixture_padding: "x".repeat(6000) };
  const encoded =
    "base64-" + Buffer.from(JSON.stringify(expired)).toString("base64url");
  await context.clearCookies({ name: sessionCookie!.name });
  await context.addCookies(
    Array.from({ length: Math.ceil(encoded.length / 3000) }, (_, index) => ({
      ...sessionCookie!,
      name: `${sessionCookie!.name}.${index}`,
      value: encoded.slice(index * 3000, (index + 1) * 3000),
    })),
  );
  await page.reload();
  await expect(page).toHaveURL(/astronaut\/health-history$/);
  await expect(
    page.getByRole("heading", {
      name: "Your history starts with one check-in",
    }),
  ).toBeVisible();
  const refreshed = (await context.cookies()).find(
    (cookie) => cookie.name === sessionCookie!.name,
  )!;
  expect(refreshed).toBeDefined();
  expect(
    (await context.cookies()).some((cookie) =>
      cookie.name.startsWith(sessionCookie!.name + "."),
    ),
  ).toBe(false);
  const parsed = JSON.parse(
    Buffer.from(
      refreshed.value.replace(/^base64-/, ""),
      "base64url",
    ).toString(),
  );
  expect(parsed.expires_at).toBeGreaterThan(Date.now() / 1000);
  expect(parsed.refresh_token === expired.refresh_token).toBe(false);
  const restored = await browser.newContext({
    storageState: await context.storageState(),
  });
  const returned = await restored.newPage();
  await returned.goto("/astronaut/health-history");
  await expect(
    returned.getByRole("heading", {
      name: "Your history starts with one check-in",
    }),
  ).toBeVisible();
  await restored.close();
});
test("temporary session-check outage hides private UI without logging out; retry recovers", async ({
  page,
}) => {
  await login(page);
  await page.route("**/auth/session", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Temporary fixture outage" }),
    }),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your connection needs attention" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/astronaut$/);
  await expect(
    page.getByRole("heading", { name: "Welcome, Fixture B" }),
  ).toHaveCount(0);
  await page.unroute("**/auth/session");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Fixture B" }),
  ).toBeVisible();
});
test("valid Back/forward restore re-verifies identity instead of forcing sign-in", async ({
  page,
}) => {
  await login(page);
  await page.goto("/astronaut/health-history");
  await expect(
    page.getByRole("heading", { name: "Health History", exact: true }),
  ).toBeVisible();
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    ),
  );
  await expect(
    page.getByRole("heading", { name: "Health History", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/astronaut\/health-history$/);
});
test("password recovery supports PKCE email callback, new-password login and expired-link handling", async ({
  page,
}) => {
  await page.goto("/auth/forgot-password");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("fixture-a@example.invalid");
  await page
    .getByRole("button", { name: "Send reset link", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "If this address is eligible",
  );
  await page.goto(
    "/auth/callback?code=fictional-pkce-code&next=/auth/update-password",
  );
  await expect(page).toHaveURL(/auth\/update-password$/);
  await page
    .getByLabel("New password", { exact: true })
    .fill("recovered-fictional-passphrase");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("recovered-fictional-passphrase");
  await page
    .getByRole("button", { name: "Save new password", exact: true })
    .click();
  await expect(page).toHaveURL(/auth\/login\?reason=password-updated/);
  await page
    .getByLabel("Email address", { exact: true })
    .fill("fixture-a@example.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fictional-passphrase");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "could not sign you in",
  );
  await page
    .getByLabel("Password", { exact: true })
    .fill("recovered-fictional-passphrase");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/astronaut\/onboarding$/);
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await expect(page).toHaveURL(/auth\/login/);
  await page.goto(
    "/auth/callback?token_hash=fictional-expired-link&type=recovery",
  );
  await expect(page).toHaveURL(/auth\/login\?reason=link-expired/);
});
