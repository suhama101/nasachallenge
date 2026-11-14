# Phase 7 homepage follow-up

Status: **READY FOR REVIEW**. Local-only work on `feature/missionpulse-ux-phase7`; no commit, push, merge or deployment.

## Routing

- `/` displays the beginner-friendly welcome experience immediately, including Try Interactive Demo, Create Account and Sign In. It also does so on refresh and repeat visits: no visit-tracking flag, cookie or account preference was added.
- `/welcome` remains available and renders the same shared `WelcomeExperience` component. There is no redirect or duplicated welcome implementation.
- `/demo` remains the existing guided demonstration. An Open Mission Overview link reaches `/demo/overview`.
- `/demo/overview` contains the prior Phase 7 root dashboard. Only its component function name changed when moving it; its record selection, calculations, forms, chart props and data boundaries were retained.
- Existing demo navigation, brand and “Back/Return to Mission Overview” links now reach `/demo/overview`.
- All existing check-in, history, insights, knowledge, assistant, auth and astronaut routes remain available. `/astronaut` remains the personal Mission Overview.

The root route is now included in the existing public/account presentation shell alongside `/welcome`. That one condition is the entire change to `application-frame.tsx`. It prevents a public homepage visit from mounting the demo providers; auth verification, session handling and protected-route conditions are unchanged.

## Safety review

- Auth utilities/actions, Proxy, Supabase integration, API handlers, ownership rules, health calculations, validation, repositories, database schema/migrations, environment files and package/configuration files are unchanged.
- Of the original 61 Phase 7 protected-file hashes, 60 remain identical. The sole difference is the reviewed addition of the `/` presentation-shell condition. Its exact expected difference was checked against the baseline.
- `.env.local` is still Git-ignored. Changed/new files were scanned for credential, token, private-key and database connection-string patterns with no potential secrets found.
- No real Supabase account or personal record was accessed or modified. Browser tests use fresh contexts; mock Auth/personal tests use the existing isolated loopback fixture.
- Prior dashboard regression tests now open `/demo/overview` rather than `/`. Their assertions and record-integrity checks are unchanged. The separate homepage tests exercise the new `/` behavior.

## Verification

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; 34 generated pages including the new dashboard URL |
| `npm test` | 238 passed in 10 files |
| Homepage/demo/presentation browser suite | 51 passed across desktop, tablet and mobile |
| Mocked authentication/personal browser suite | 30 passed across desktop and mobile |
| No-key browser suite | 6 passed across desktop, tablet and mobile |
| Total browser suite results | 87 passed; no failed or skipped tests |

The added homepage tests cover `/` and `/welcome`, reload, all three entry actions, absence of demo storage on fresh welcome visits, mobile/tablet/desktop width, the demo guide/dashboard route, return navigation, and byte-for-byte preservation of existing isolated browser-demo records across welcome and demo visits.

The existing suites continue to cover protected routes, session refresh/recovery/logout, personal CRUD, demo/personal separation, optional nulls and legacy SpO₂, saved history, insights, assistant fallback, scenarios and research navigation.

Additional read-only checks against the local production build confirmed HTTP 200 for `/`, `/welcome`, `/demo` and `/demo/overview`. A fresh mobile browser visiting `/astronaut`, `/astronaut/daily-health-check`, `/astronaut/health-history` and `/astronaut/health-insights` was redirected to sign-in in all four cases, with no personal workspace displayed or demo storage created. Protected pages use Next.js streamed redirects, so browser navigation was verified rather than inferring protection from HTTP status alone.

The mock dev server emits the baseline color-environment notices and canceled-navigation `aborted`/`ECONNRESET` diagnostics. All suites finish successfully. The previous preview server's accumulated output also contained Auth network-fetch errors before it was restarted for this build; no credential or environment change was made to address those historical logs. Live account connectivity and email delivery remain outside this routing check.

Evidence: `test-results/phase7-homepage/` contains homepage screenshots at desktop (1440×1000), tablet (834×1112) and mobile (390×844). These artifacts are Git-ignored.

## Local preview and limitations

Open `http://localhost:3001/` for the public homepage, `http://localhost:3001/demo` for the walkthrough, or `http://localhost:3001/demo/overview` for the demo dashboard. The local production preview is kept running.

Live two-account Supabase RLS, actual email delivery and live authenticated account data were not retested. Protected-route/session and personal-record coverage uses the existing mocks. No production settings or credentials were changed. Browser coverage uses Edge contexts, not physical devices or a full assistive-technology audit.

Production remains untouched at `d55fc2fb55366da927718be95eb461024645b71e`. The previous Phase 7 rollback/publication gate still applies: preserve local work before switching branches; no production action is needed now. Any commit, merge, push or deployment requires explicit approval.
