# MissionPulse

An astronaut health-monitoring research prototype for NASA Space Apps Challenge 2026. Independent project; not NASA-endorsed or a certified medical diagnostic system. No clinical diagnosis, risk scoring or treatment recommendations are generated.

**Phase 2 implements the complete local-demo check-in workflow.** Production URL: https://missionpulse.vercel.app. The owner approved publication of Phase 2 on 14 November 2026; the connected Vercel project deploys commits pushed to `main`. Confirm the current commit and Ready status in Vercel when reviewing a release.

## Run locally

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

## Implemented features

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

## Supabase schema and future setup

**Not needed for demo mode. No credentials were configured or migrations applied.**

`supabase/migrations/202611140001_health_records.sql` creates:

- `astronaut_profiles`: UUID ID, unique owning `auth.users` ID, display name, crew ID, mission name and created timestamp. Deleting the auth user cascades to their profile.
- `health_check_ins`: UUID/idempotency ID, profile foreign key, submission timestamp, separate mission-local date, nullable typed measurements, wellness, symptom array, notes, data source and created/updated timestamps. Profile deletion cascades to its check-ins. Indexes cover profile + submission time and profile + mission date. A trigger updates `updated_at` and preserves `created_at` on edits.
- RLS is enabled and forced on both tables. Anonymous roles have no table privileges. Authenticated users can select/insert/update/delete only their owned profile and its records. Update policies check both existing and resulting ownership to prevent transferring rows. Authenticated health rows accept only `user-entered` sources; the demo profile UUID and demo sources are rejected.

When you're ready for the **next authentication phase**:

1. With the project owner's involvement, create/select a Supabase development project. Review and apply the migration in its SQL Editor or through a deliberately linked Supabase CLI workflow. Do not run test fixtures on production.
2. Copy `.env.example` to `.env.local` and fill only `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` using your project's URL and publishable key (legacy anon key also works). Keep the file ignored. No privileged secret/service-role key is required or supported by this adapter.
3. Implement authentication and owned-profile onboarding in a later phase. The existing server-only factory `createAuthenticatedHealthRepository(accessToken)` verifies a user access token with `auth.getUser`, resolves the user's profile, and uses their JWT with the publishable key so RLS remains effective. No profile/auth UI, server route or automatic storage-mode toggle has been added here.
4. After the migration is applied, regenerate database types for your actual schema and run the ownership tests before connecting any real accounts. Do not import local demo records into authenticated storage.

Environment variables are accessed lazily, only inside the server-only factory; missing variables cannot break build or local demo. The demo provider always chooses IndexedDB even if credentials happen to exist. `GROQ_API_KEY` and privileged Supabase keys are not requested. Secrets must never be placed in client modules or prefixed `NEXT_PUBLIC_`.

## Tests and development commands

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd test
npm.cmd run test:e2e
```

- `npm test`: 48 tests covering required/optional validation, unusual accepted values, invalid inputs, actual fake-indexeddb transactions, saving, reloading via a fresh repository, concurrent duplicate IDs/tabs, ordering, date filters, latest-record summaries, missing values, complete-day status, one-time seeding, reset persistence, corrupt/unavailable storage, mapping and authorization boundary assumptions.
- `npm run test:e2e`: the complete form → save → history → reload → filters → dashboard → reset path at desktop (1440px), tablet (834px) and mobile (390px), including plotted values, duplicate submit events, no horizontal overflow and runtime-error checks. Uses installed **Microsoft Edge** via Playwright (`channel: "msedge"`) and isolated browser contexts. Reuses localhost:3000 if running, or starts a server there. If Edge is unavailable, install it or change the channel to a locally installed supported browser. Screenshots and failure traces stay in ignored `test-results/`.
- `npm run test:watch`: interactive unit-test development.
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

GitHub `suhama101/nasachallenge` is already connected to Vercel; pushes to `main` trigger production deployments. Publication requires the owner's explicit approval; approval for this Phase 2 release was given on 14 November 2026. See `DEPLOYMENT.md` for the existing hosting setup.

## Known limits

- Browser storage is local to this site/origin and browser profile, not encrypted medical-record infrastructure, synchronized storage or a backup. Clearing site data removes it. Storage denial/quota errors are surfaced rather than reporting a false save. No personal medical information should be entered.
- The fixed fictional mission-day counter is scenario context; the active check-in date and data timestamps are live and labeled UTC.
- The insights, knowledge library, assistant and crew-profile routes remain labeled future modules. No chatbot/Groq, login, real-account storage switching, edit/delete individual record flow, clinical algorithm, diagnosis or treatment recommendation is implemented.
- The Supabase adapter/schema are prepared, not connected to a deployed database or authentication flow. Real RLS tests require the optional local stack above.
- Seven pre-existing moderate development dependency advisories in the ESLint chain remain from Phase 1. The earlier compatible automatic fix did not resolve them; the Phase 2 production dependency audit (`npm audit --omit=dev`) reported zero vulnerabilities.
