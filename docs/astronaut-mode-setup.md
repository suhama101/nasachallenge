# Astronaut Mode foundation — local implementation

Current release approval and account-recovery instructions are recorded in
[session and release notes](session-and-release.md); older setup gates below are
retained as the foundation's historical record.

**Phase 6C update:** authenticated personal check-ins, cloud history editing/deletion
and personal insights are now implemented locally. See [the current verification
and deployment gates](phase-6c-personal-health.md). The foundation-only scope below
is retained as the earlier setup record; live RLS/cloud verification remains gated.

This step implements email/password authentication and personal profile onboarding.
It does **not** enable personal health recording, cloud history, private insights,
or private assistant context. Those screens must not show fictional data as a
fallback. No live Supabase project has been accessed or modified, and no
migration or environment change has been applied to production.

## Try locally without credentials

Run `npm run dev` and open `http://localhost:3000/welcome`.
The two choices are Astronaut Mode and Explore Demo. The existing `/` Mission
Overview also presents both choices while preserving its explicitly fictional
dashboard and legacy demo URLs. Authentication routes and `/astronaut/*` never
mount the demo health/scenario providers, open IndexedDB, or import demo records.
Without public configuration, account forms are disabled with a friendly setup
message. The demo needs no credentials and retains its existing database/version.

## Files and architecture

- `src/lib/auth/`: validated public configuration, per-request SSR cookie client,
  browser session listener, form validation, account operations, server access
  checks, and owner-scoped profile repository.
- `src/proxy.ts`: cookie refresh on account routes, private no-store responses,
  same-origin referrer protection and noindex headers. No shared global Supabase server client.
- `src/app/auth/`: server actions, verification/PKCE callback, minimal no-store
  session endpoint, signup/login/verification/reset screens.
- `src/app/astronaut/`: server-authorized overview, onboarding, profile edit and
  a clearly disabled personal health-recording entry. Each page/action checks
  the session independently; authorization is not trusted to a cached layout.
- `src/components/`: mode entry, account forms, responsive personal navigation,
  session guard and mode-specific provider boundary. Existing dashboard layout
  is retained apart from the required mode choice/navigation.
- `supabase/migrations/202611140003_astronaut_accounts.sql`: additive preparation
  for mission environment/start date/role, immutable profile/check-in identity,
  and the new-write SpO₂ constraint. Earlier migrations remain unchanged.
- `tests/auth.test.ts`, `tests/auth-e2e/`, `tests/e2e/auth-unconfigured.spec.ts`,
  `tests/support/` and `playwright.auth.config.ts`: validation/service/ownership
  mocks, no-key preservation tests, and a local fictional SSR HTTP fixture.

## Manual Supabase setup (approval required before connecting)

1. Obtain explicit approval to use a disposable **development** Supabase project.
   Do not run fixture tests or schema experiments against production.
2. In that approved project, review and apply these migrations in order:
   `202611140001_health_records.sql`, `202611140002_urgent_report.sql`,
   `202611140003_astronaut_accounts.sql`. The app never executes migrations.
   For an existing project, first inventory existing schema/migration history
   and private records; do not replay already-applied migrations.
3. The third migration preserves old oxygen readings with a `NOT VALID` check;
   new inserts/updates must be null or 1–100. It never corrects or deletes
   historical zeros. Updating a legacy-invalid row will fail until an explicit,
   reviewed correction is made. Do not validate the constraint until that audit
   is complete. Crew IDs are user-chosen simulation labels, not globally unique
   identity proof. `user_id` uniquely permits one owned profile per Auth user.
4. Enable Email/password sign-in and **Confirm email** in Authentication. Set a
   minimum password length of 12 or stronger. Configure email delivery/SMTP,
   rate limits and abuse protections appropriate to the approved environment.
5. Set the Auth Site URL to your local trusted origin, e.g.
   `http://localhost:3000`. Add these exact allowed redirect URLs:
   `http://localhost:3000/auth/callback` and
   `http://localhost:3000/auth/callback?next=/auth/update-password`.
   Use the actual port if different. Avoid broad production redirect wildcards.
6. SSR supports default PKCE email redirects in the initiating browser. For
   token-hash templates that also work across browsers, use these email links:
   - Confirmation: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email`
   - Password recovery: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery`
     Keep templates, Site URL and redirect allowlist consistent. Verify both real
     emails and expired/used links in the approved development project.
7. Copy `.env.example` to Git-ignored `.env.local`. Set only:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and
   server-only `APP_URL=http://localhost:3000`. Legacy projects can set
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead of the publishable key. Public keys
   identify the project and depend on RLS; never supply `sb_secret_` or a
   service-role JWT. No privileged key is required. Do not paste keys into chat.
8. Restart Next.js. Sign up with two test email accounts, verify delivery,
   onboard, edit, sign out, test reset/expiry/account switching and session
   refresh. Confirm no email enumeration through the app's responses.
9. Run `supabase test db` against the approved disposable stack after all
   migrations. `supabase/tests/ownership.sql` contains 30 assertions for grants,
   owner CRUD, profile isolation, immutable IDs and measurement constraints.
   Verify anonymous denial and owner A/B isolation with real tokens as well.
10. Regenerate `src/lib/health/database.types.ts` from the actual approved schema.
    Current types are hand-maintained preparation, not a database introspection.

## Security and data boundaries

- All private page and profile operations call server-side `getUser`, require
  confirmed email, and derive ownership from the verified user, never form IDs.
  Profile reads/writes filter the owner; returned owner IDs are checked again.
- Existing forced RLS and owner SELECT/INSERT/UPDATE/DELETE policies remain.
  Anonymous table access is denied; no service-role bypass is used.
- Sessions use supported SSR cookies; the Proxy propagates refreshed cookies
  and Supabase response headers. Secrets/tokens are never returned in form state
  or logged by app code. Avoid logging callback query strings in hosting tools.
- Server Actions retain Next.js same-origin protections. Email destinations use
  explicit `APP_URL`, not untrusted request headers. Callback targets are an
  exact local allowlist, and token parameters are removed on redirect. Callback responses use no-referrer; normal account pages keep same-origin referrers so native logout POSTs retain their Origin header.
- Signup, resend and reset use the same generic public outcome for eligible,
  unknown and provider-error addresses. Email delivery is not promised. Login
  failures never reveal whether an address exists. Provider-side rate limits
  remain necessary; no email service is mocked in production code.
- Full-document account transitions discard private React/router state. Private
  data is not put in local/session storage or demo IndexedDB. The session guard
  reacts to auth events, cross-tab transitions, focus, browser history restore,
  and periodic verification; connection failures hide personal content.
- The future health repository still requires a verified token and owned
  profile under RLS. It is not connected to a health-writing route or UI.
  Private assistant requests are also not enabled.
- This is a research prototype. Signup is not professional identity validation.
  Authentication/RLS alone do not establish healthcare compliance or clinical
  suitability. Review privacy/retention/deletion/access requirements before
  collecting any real medical information.

## Automated checks and evidence limits

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and
`npm run test:e2e`. The default browser suite exercises no-key demo behavior.
Run `npm run test:auth:e2e` for desktop/mobile account tests using a loopback-only
fictional HTTP fixture on 127.0.0.1:4400 and a separate local Next.js server on
localhost:3102. Neither is a real Supabase service. It uses generated fictional
sessions, never owner credentials. All test records are isolated fictional data.
Its `.next-auth-tests/`, generated `tsconfig.auth-fixture.json`, reports and browser
state are ignored by Git. Do not run default no-key and configured auth suites
against the same server; their credentials and build directories are separate.

Mocks verify app behavior and owner filters, **not** PostgreSQL RLS execution,
email delivery, JWT signatures, real cookie refresh, actual session revocation,
or cross-device account/cloud health persistence. Those gates require the
approved development project and real integration tests. No complete cloud
history workflow is claimed by this implementation.

## Before Vercel deployment (separate approval required)

Local verification completed on 14 November 2026:

- Lint, TypeScript and production build passed.
- 200 unit tests passed across seven files.
- 39 production-build no-key/demo browser tests passed across desktop, tablet
  and mobile, including saved-record preservation and Step 6A SpO₂ regressions.
- 12 mocked SSR account browser tests passed across desktop/mobile, including
  signup/login validation, email help, recovery, onboarding, profile edits,
  reload persistence, two-owner separation, expiry, cross-tab logout and Back.
- Source/credential-pattern scan covered 132 versioned/candidate files with no
  credential-pattern or sensitive-path findings. Test passwords and session
  material are fictional and isolated. Real environment files remain ignored.
- The 30 SQL/RLS assertions are prepared but **not executed**. No approved live
  Supabase connection or actual email/token integration was tested.
- `npm audit` reports seven pre-existing moderate transitive development-tool
  advisories in the ESLint/typescript-eslint/minimatch dependency chain, with
  no high/critical findings. These are not new runtime auth dependencies; a
  separate dependency update remains to be reviewed.
- Local preview `/welcome` responds on ports 3000 and 3001. Work remains local,
  uncommitted and undeployed; Git HEAD is still the approved Step 6A commit
  `fbec0bfe5b9784be3f0b0fef2149f59f346d9cae`.

1. Review local changes, scan for secrets and confirm all checks pass.
2. Complete the development Supabase integration gates above. Address failures
   before enabling account access for real users.
3. Obtain explicit approval before production migrations, environment changes,
   commit, push or deployment. Existing Step 6A publishing approval does not
   authorize this new implementation's release.
4. For an approved production release, use the **existing** MissionPulse Vercel
   project. Set the two public Supabase variables and
   `APP_URL=https://missionpulse.vercel.app` privately in Vercel. Add exact
   production callback URLs and update the Supabase production Site URL/email
   templates for that origin. Public variables require a new build.
5. Deploy only after approval; verify exact Git SHA Ready and test live account
   flows with authorized test accounts. Personal health storage stays unavailable
   until the separate persistence integration is implemented and verified.

References checked during implementation:
[Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client),
[password authentication](https://supabase.com/docs/guides/auth/passwords),
[user profiles](https://supabase.com/docs/guides/auth/managing-user-data), and
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
