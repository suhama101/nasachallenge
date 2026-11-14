# MissionPulse

An astronaut health-monitoring research prototype for NASA Space Apps Challenge 2026. Independent project; not NASA-endorsed or a certified medical diagnostic system. No clinical diagnosis, risk scoring or treatment recommendations are generated.

**Phase 5 adds an audited, guided mission demonstration and quality improvements to the Phase 4 knowledge library and assistant.** Production URL: https://missionpulse.vercel.app. The owner approved publishing Phase 5 to the existing GitHub/Vercel project on 14 November 2026. Verify the exact deployed commit and Ready status before reporting a release as live. Live Groq remains disabled without complete private configuration.

## Run locally

Open **Explore MissionPulse Demo** on Mission Overview or `/demo`. The guide preserves existing saved records and connects the check-in, history, insights, assistant and research workflows. See [the timed demo script](docs/demo-script.md) and [submission readiness audit](docs/submission-readiness.md). Phase 5 publication has been approved; verify Vercel's exact commit and production alias before treating a release as deployed.

Use Node.js **24.x** and npm. No login, Supabase project, API keys or environment file is required.

```powershell
cd "C:\Users\Suhama\Desktop\New folder\missionpulse"
npm.cmd ci
npm.cmd run dev
```

Open http://localhost:3000. If a development server is already running, reuse it rather than starting a second instance in this checkout. On macOS/Linux use `npm` instead of `npm.cmd`.

## Try the complete demo workflow

1. Open **Mission Overview**. The first visit initializes 14 fictional check-ins for the two weeks ending yesterday. All synthetic rows are labeled. The astronaut is the fictional Alex Morgan (AST-0042).
2. Open **Daily Health Check**. Required fields start empty. Choose a mission-local date, enter vital signs and wellness ratings, optionally select symptoms and add notes, then save. Use fictional readings only; nothing is obtained from a medical device.
3. The confirmation shows the selected mission date and actual UTC submission timestamp separately. View **Health History**, expand your record, filter by mission dates, and inspect the five charts and accessible exact-value tables.
4. Return to **Mission Overview**. Its cards use the newest recorded submission, its check-in status reflects today's complete user-entered entry, and its charts use the shared records. A backdated submission can be the newest recorded check-in while appearing at its selected date in charts.
5. Refresh. IndexedDB preserves both the original seeds and your entries. Switching routes updates immediately; other tabs refresh through BroadcastChannel when available and on window focus.
6. Use **Health History → Reset demo data**. Cancel preserves all records. Confirm deletes **all** local demo entries, including seeds. Empty states remain after refresh; the app deliberately does not reseed after a reset. Save a new check-in to start again. Clearing this site's browser storage completely creates a fresh demo database on the next visit.

Mission-local calendar is explicitly **UTC** for this fictional mission; it is independent of the device's timezone. The manually selected `YYYY-MM-DD` is not converted to a timestamp. Submission, created and updated timestamps are UTC instants. More than one deliberate check-in per mission date is supported; submission UUIDs make retries idempotent.

## Phase 3: Health Insights and explainable monitoring

Open http://localhost:3000/health-insights. The module analyzes the selected local demo records; the dashboard observation panel shares the **same computed report**. Existing entry, storage, history, charts and reset behavior are preserved. This deterministic engine remains independent of Groq, authentication and external analysis services.

- Per-indicator rolling medians, baseline sample counts and reference periods; the current mission date is excluded from its baseline. Default minimum: 5 earlier distinct mission dates; configurable to 3, 5, 7 or 10 in the interface.
- 7-/30-day means with actual sample counts, population variability, calendar-day regression slopes, absolute/relative differences, consecutive changes, missing data and timestamp freshness.
- Mood remains categorical and uses its historical mode; no numeric mood score is invented. Zero baselines produce no relative percentage. Valid outliers remain in the baseline and can be inspected.
- Measurement-specific, explicitly unvalidated software comparison rules; observation cards show what changed, compared with what, when, the supporting records, limitations and a suggested monitoring action. Statistics do not establish a diagnosis or health/safety status.
- Current-versus-baseline, 7-/30-day trend, sleep/fatigue, completeness and observation-timeline charts, with accessible data tables. Extra stable comparisons and detailed historical titles are expandable.
- Source-linked educational modules on isolation, gravity, cardiovascular adaptations, sleep/schedules, behavioral health, fitness, radiation and consistent records. NASA's [hazards](https://www.nasa.gov/hrp/hazards/), [risks](https://www.nasa.gov/hrp/risks/), [sleep research](https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/) and [ongoing research](https://www.nasa.gov/hrp/ongoing-hrp-research/) provide context, **not validation of our thresholds**. Content/links were checked on 14 November 2026.
- Simulated mission context and communication status are labeled fictional and do not modify analysis rules.

**Monitoring categories:** stable compared with baseline means no stated comparison rule was met, not normal health; change observed means a prototype indicator rule was met; review suggested means repeated changes or supported co-occurrence; insufficient information means missing, stale, invalid or inadequate baseline evidence. The interface separates educational context, descriptive statistics and urgent-procedure guidance.

**Try the scenarios:** choose A (routine), B (declining sleep/increasing fatigue), or C (resting heart-rate change). Each is an isolated 21-day synthetic dataset with its own profile UUID. The selection affects analysis on Insights and the dashboard observation panel, but never writes to or replaces saved history or dashboard measurement cards. Return to saved records or refresh to leave a scenario. C includes a scenario-only urgent-report control.

**Urgent reports:** the daily form now has an explicit user-declared urgent-symptom flag. Selecting it immediately directs the user to seek assessment through the crew's established medical emergency procedure, before saving. A saved flag overrides statistical reassurance in both observation views, including when the engine cannot use the associated reading or timestamp. No approved clinical escalation protocol is configured, no treatment instructions are generated, and notes/symptom names are not automatically screened. Old records default to no explicitly reported flag; that is not a health assessment. Flags do not silently expire because symptom resolution is not implemented.

Read [the complete methodology](docs/analysis-methodology.md) for formulas, per-indicator rules, reference windows, outlier handling, historical cutoffs, source isolation, urgency safeguards and scientific limitations. Reported reading precision is preserved in evidence tables; computed statistics are rounded only for display. Synthetic tests establish software behavior, not medical accuracy.

## Other implemented features

- Full required vital signs: heart rate, systolic/diastolic blood pressure, temperature and SpO₂; optional glucose.
- Sleep, mood, fatigue (0–10), exercise; optional water, symptoms and notes.
- Shared Zod validation at form and repository boundaries, field errors, focusable linked error summary, success confirmation and duplicate-submit protection.
- IndexedDB transactions with atomic first-initialization marker and seeds; no volatile-memory fallback that pretends to save successfully.
- Persistent history, inclusive mission-date filters, newest-record summaries, full record details and source labels.
- Recharts for heart rate, sleep, temperature, SpO₂ and both blood-pressure series, with missing readings kept as gaps and nulls excluded from averages.
- Dashboard bound to the same data, including recorded timestamps, today's check-in status and a working record action. No stale static health cards or clinical observations.
- Loading, unavailable-storage, empty, validation and reset states; desktop/mobile layouts retain the existing navy/cyan design.
- Server-only future Supabase repository, typed row mapping, PostgreSQL migration and ownership policies. Authentication UI and profile onboarding remain deferred.

## Validation and missing values

The required form checks are data-entry guardrails, **not** normal medical ranges. Unusual but plausible values are accepted. Blank required values fail; optional blanks become `null`, never zero. Zero sleep/exercise/fatigue/water are preserved when explicitly entered. NaN, infinity, malformed dates, unknown enum values, overlong notes and reversed blood-pressure entries fail.

| Field                | Broad input bounds                                      |
| -------------------- | ------------------------------------------------------- |
| Resting heart rate   | 1–350 bpm, whole number                                 |
| Systolic / diastolic | 1–400 / 1–300 mmHg, whole numbers; systolic > diastolic |
| Temperature          | 20–50 °C                                                |
| SpO₂                 | 0–100%                                                  |
| Optional glucose     | 1–2,000 mg/dL                                           |
| Sleep                | 0–24 hours                                              |
| Fatigue              | Integer 0–10                                            |
| Exercise             | Integer 0–1,440 minutes                                 |
| Optional water       | 0–30 liters                                             |

These broad limits do not certify clinical validity or establish medical risk. Bounds are centralized in `src/lib/health/validation.ts` and mirrored as database constraints. Future operational use needs qualified clinical review. Stored record types also support missing vital signs for future imports; the UI never replaces a missing value with an older reading or a fabricated measurement.

## Architecture

| Location                                                                    | Responsibility                                                                |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/lib/health/validation.ts`                                              | Domain schemas, input validation and types                                    |
| `src/lib/health/dates.ts`, `selectors.ts`                                   | Explicit UTC calendar, filtering, chronology and summaries                    |
| `src/lib/health/repository.ts`                                              | Shared `HealthRepository` contract and isolated fictional profile ID          |
| `src/lib/health/indexeddb-repository.ts`, `seed.ts`                         | Browser-only persistence, idempotent transactions and first-run seeds         |
| `src/components/health-provider.tsx`                                        | Shared loading/error/data state, mutation refresh and cross-tab notifications |
| `src/components/daily-health-form.tsx`                                      | Accessible validated entry and save confirmation                              |
| `src/components/health-history.tsx`, `health-charts.tsx`, `metric-card.tsx` | Shared record details, charts and most-recent-record summaries                |
| `src/lib/health/supabase-repository.server.ts`                              | Unused-by-demo, authenticated server-only adapter                             |
| `src/lib/health/database.types.ts`, `supabase-mapping.ts`                   | Typed database rows, conversion and demo/account boundary checks              |
| `supabase/migrations/`                                                      | PostgreSQL schema and RLS                                                     |
| `tests/`, `supabase/tests/`                                                 | Executable local tests and optional SQL integration tests                     |

Stack: Next.js App Router, strict TypeScript, React, Tailwind v4, shadcn/ui Button and Radix AlertDialog, Lucide, Recharts, Zod, official `@supabase/supabase-js`. Fonts are bundled locally. Tests use Vitest, fake-indexeddb and Playwright. No workers, runtime filesystem persistence or external medical-device APIs are used.

Phase 3 code is under `src/lib/insights/` (statistics, analysis, typed configuration, verified references and scenario datasets), `src/components/insights-provider.tsx` (shared selection/report), and `health-insights.tsx`, `insights-analytics.tsx`, `insight-card.tsx` (interface and dashboard summary). Deterministic fixtures and tests are in `tests/insights.fixtures.ts`, `tests/insights.test.ts` and `tests/e2e/insights.spec.ts`.

## Phase 4: knowledge and assistant

Open `/space-health-knowledge` to search 17 NASA/CSA entries, filter topics and open individual source-linked pages. Open `/ai-health-assistant` for education, deterministic yesterday/7-/30-date measurement queries, missing-reading counts and Phase 3 baseline explanations. Opt into measurements separately for each message. Select saved demo or scenarios A/B/C to keep conversations separate. Chat persists locally across refresh; clearing requires confirmation.

The no-key demo is fully useful and clearly labeled **local deterministic / curated**, not live AI. Optional Groq selects approved educational statements only. It cannot invent visible prose, citations, personal measurements or clinical advice. Exact values and observations remain deterministic. No prior conversation is sent to the provider. See [AI-SAFETY.md](AI-SAFETY.md) for architecture, data flow, evidence, abuse controls, tests and limitations.

Code: `src/lib/knowledge/` (typed content and keyword retrieval), `src/lib/assistant/` (consent-scoped compact context, deterministic answers, safety, strict schemas, chat IndexedDB, HTTP validation, provider/budget), `src/app/api/assistant/route.ts` (Node route), and the knowledge/assistant components and routes. Provider adapters are injectable in tests; no real Groq request is made by test suites.

### Optional manual live configuration

No setup is required for fallback. To test live selection later:

1. Copy `.env.example` to ignored `.env.local`. In Groq's own console, create a server key and choose a **currently supported model with JSON-object output**; set `GROQ_API_KEY` and `GROQ_MODEL`. Never paste secrets in chat, source, screenshots or `NEXT_PUBLIC_` variables. Consult [Groq quickstart](https://console.groq.com/docs/quickstart) and [API reference](https://console.groq.com/docs/api-reference).
2. Provision an optional Upstash Redis REST database for a durable public request budget; put its HTTPS URL and private REST token in `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`. This is required only for live paid-provider calls, not ordinary app use. See [Upstash REST documentation](https://upstash.com/docs/redis/features/restapi). Only atomic counter keys are stored, never prompts or health data.
3. Set `GROQ_LIVE_ENABLED=true`. Defaults cap shared calls at 6/minute and 100/UTC day; optional `GROQ_REQUESTS_PER_MINUTE` / `GROQ_REQUESTS_PER_DAY` lower or adjust these within hard maxima of 20 and 500. Set account spending limits separately.
4. Restart local Next.js and enable the visible live checkbox. Verify a source-linked response labeled **Groq-assisted selection**. Malformed output, configuration/model errors, timeout or budget failure returns an honest local fallback. No real provider integration was verified during the no-key implementation.
5. After explicit publication approval, configure these same private variables in the **existing** Vercel project's settings and redeploy using standard Next.js defaults. Do not create another project. Leaving them unset deploys a working fallback. Publishing Phase 4 and changing production environment variables require separate explicit approval.

Health records and chat never upload to Supabase. Public demo datasets and client-provided dataset enums are not authentication. No source page is fetched at chat runtime. Known limits include keyword-based retrieval/safety, independent messages, browser-local unencrypted storage, no configured emergency protocol and no unrestricted model prose.

## Supabase schema and future setup (deferred)

**Not needed for demo mode. No credentials were configured or migrations applied.**

`supabase/migrations/202611140001_health_records.sql` creates:

- `astronaut_profiles`: UUID ID, unique owning `auth.users` ID, display name, crew ID, mission name and created timestamp. Deleting the auth user cascades to their profile.
- `health_check_ins`: UUID/idempotency ID, profile foreign key, submission timestamp, separate mission-local date, nullable typed measurements, wellness, symptom array, notes, data source and created/updated timestamps. Profile deletion cascades to its check-ins. Indexes cover profile + submission time and profile + mission date. A trigger updates `updated_at` and preserves `created_at` on edits.
- RLS is enabled and forced on both tables. Anonymous roles have no table privileges. Authenticated users can select/insert/update/delete only their owned profile and its records. Update policies check both existing and resulting ownership to prevent transferring rows. Authenticated health rows accept only `user-entered` sources; the demo profile UUID and demo sources are rejected.

`202611140002_urgent_report.sql` adds a default-false `urgent_symptom_reported` boolean. It is a user-declared urgency flag, not a clinical classification. It is additive, leaves existing RLS in force, and has not been applied to a hosted database.

When you're ready for the **next authentication phase**:

1. With the project owner's involvement, create/select a Supabase development project. Review and apply both migrations in timestamp order in its SQL Editor or through a deliberately linked Supabase CLI workflow. Do not run test fixtures on production.
2. Copy `.env.example` to `.env.local` and fill only `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` using your project's URL and publishable key (legacy anon key also works). Keep the file ignored. No privileged secret/service-role key is required or supported by this adapter.
3. Implement authentication and owned-profile onboarding in a later phase. The existing server-only factory `createAuthenticatedHealthRepository(accessToken)` verifies a user access token with `auth.getUser`, resolves the user's profile, and uses their JWT with the publishable key so RLS remains effective. No profile/auth UI, server route or automatic storage-mode toggle has been added here.
4. After the migration is applied, regenerate database types for your actual schema and run the ownership tests before connecting any real accounts. Do not import local demo records into authenticated storage.

Environment variables are accessed only in server-only factories; missing variables cannot break build or local demo. The demo provider always chooses IndexedDB even if credentials exist. Optional Groq setup is described below; privileged Supabase keys are never needed. Secrets must never be placed in client modules or prefixed `NEXT_PUBLIC_`.

## Tests and development commands

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd test
npm.cmd run test:e2e
```

- `npm test`: 139 tests covering check-ins, repositories, Phase 3 analysis and the Phase 4 assistant, including the documented 14-question evaluation set, retrieval/citations, exact values, consent, isolated context, safety, mocked Groq/atomic budget calls, HTTP validation, timeout/fallback behavior and persistent/corrupt storage. Fixtures are deterministic; no clinical accuracy is claimed.
- `npm run test:e2e`: the complete form → save → history → reload → filters → dashboard → reset path at desktop (1440px), tablet (834px) and mobile (390px), including plotted values, duplicate submit events, no horizontal overflow and runtime-error checks. Uses installed **Microsoft Edge** via Playwright (`channel: "msedge"`) and isolated browser contexts. Reuses localhost:3000 if running, or starts a server there. If Edge is unavailable, install it or change the channel to a locally installed supported browser. Screenshots and failure traces stay in ignored `test-results/`.
- `npm run test:watch`: interactive unit-test development.
- The browser suite covers Phase 2–3 workflows plus Phase 4 library search, topic navigation, consent, persistent conversations, scenario isolation, live-request payloads and urgent fallback across desktop, tablet and mobile. Provider responses are mocked; no paid API calls are required. Use `PLAYWRIGHT_BASE_URL` only for an explicitly approved review target.
- `npm start`: serve a completed production build.

To run **optional real PostgreSQL/RLS tests**, use Docker Desktop and the Supabase CLI against a new disposable local stack:

```powershell
# One-time: generates local config; no hosted project login required.
npx.cmd supabase init
npx.cmd supabase start
npx.cmd supabase test db supabase/tests/ownership.sql
```

Fresh local startup applies the migration. For an already initialized **disposable local** database, use your normal local migration workflow before testing. `supabase/tests/ownership.sql` contains 20 pgTAP assertions: owner access, cross-user reads/writes/ownership transfers, anonymous denial and data constraints. Fixtures roll back. These SQL integration tests have **not** been executed here because no Supabase/Docker test database was configured; static migration checks and adapter tests do not substitute for live RLS verification. See [Supabase database testing](https://supabase.com/docs/guides/database/testing) and [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Vercel and review boundary

Standard Next.js deployment: repository-root app (`.`), Node.js 24.x, default `npm run build` and framework output. `.gitignore` excludes local databases/config state, dependencies, builds, environments, Vercel state and test artifacts; `.env.example` contains empty placeholders only. The application does not rely on writable server files and builds without any Supabase/Groq configuration.

GitHub `suhama101/nasachallenge` is connected to the existing Vercel project `missionpulse`; pushes to `main` trigger production deployments. Publication requires explicit owner approval; approval for Phase 4 was given on 14 November 2026. See `DEPLOYMENT.md` for hosting configuration. This approval does not enable or configure live Groq.

## Known limits

- Browser storage is local to this site/origin and browser profile, not encrypted medical-record infrastructure, synchronized storage or a backup. Clearing site data removes it. Storage denial/quota errors are surfaced rather than reporting a false save. No personal medical information should be entered.
- The fixed fictional mission-day counter is scenario context; the active check-in date and data timestamps are live and labeled UTC.
- Crew Profile remains a future module. There is no login, real-account storage switching, individual record editing/deletion, diagnosis or treatment generation. The assistant is bounded to independent supported questions and curated responses; it does not infer conversational context.
- Baselines and prototype thresholds are descriptive; they do not establish normal health, causation, fitness, radiation exposure or clinical risk. Freshness is a software rule. Small/synthetic samples and manually entered data limit reliability. Urgent symptom resolution and clinician-approved escalation protocols remain unimplemented.
- The Supabase adapter/schema are prepared, not connected to a deployed database or authentication flow. Real RLS tests require the optional local stack above.
- Seven pre-existing moderate development dependency advisories in the ESLint chain remain from Phase 1. The earlier compatible automatic fix did not resolve them; the Phase 2 production dependency audit (`npm audit --omit=dev`) reported zero vulnerabilities.
