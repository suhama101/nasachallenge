# Phase 6C: personal health monitoring

Phase 6C implementation record. Current publishing approval and session-recovery
gates are in [the release notes](session-and-release.md). Existing migrations and
production settings are unchanged. Supabase project setup and migration success
were reported by the owner; this implementation does not introspect or modify the
live database, create test users there, or insert live test health records.

## Pages and manual review

Use the existing local server on port 3000. Sign in through `/auth/login` with
your approved research/simulation account, then review:

- `/astronaut`: saved mission profile, check-in count, next action, latest readings
  and manually entered trends. A new account starts empty, without Alex Morgan.
- `/astronaut/daily-health-check`: all existing validated measurements, selected
  measurement date, optional notes/symptoms and explicit urgent self-report. All
  readings are manually entered; optional SpO₂/glucose/water remain null when blank.
- `/astronaut/health-history`: reverse submission order, mission-date filters,
  record details and timestamps, confirmed editing and confirmed deletion.
- `/astronaut/health-insights`: personal baselines, missing-value-aware charts,
  evidence and limitations, descriptive observations and existing NASA references.
- `/astronaut/profile`: existing account profile editing.
- `/demo`: unchanged browser-local fictional demonstration, with no import into
  the authenticated account.

Use fictional measurements only for review in an approved test account. Save one
check-in, reload History, inspect blank optional values, edit a reading and confirm
the change. Verify the original submission/creation timestamps are unchanged.
Cancel a deletion to retain it, then explicitly confirm deletion only for a record
you intend to remove. A stale version requires reloading rather than overwriting
another edit. Review Insights with fewer than five prior dates: it must explain
insufficient baseline data rather than present invented comparisons.

## Reused code and data boundaries

`HealthCheckInForm` is extracted from the existing demo form and receives its
persistence adapter explicitly. The demo wrapper retains its original providers,
messages and behavior. The personal form uses the same validators, field help,
optional-value rules, duplicate-submit guard and urgent-report controls. It never
falls back to browser storage when a cloud operation fails.

Shared `CheckInDetails`, `LatestMeasurements`, `HealthCharts`, baseline tables,
insight cards, visual analytics and statistical engine are reused. Personal
analysis explicitly sets `mode: authenticated` and the server-owned profile ID;
other profiles and demo/synthetic sources are excluded. Research references are
educational context, not validation of comparison rules or medical advice.

Personal state stays in memory, keyed by verified user/profile, and is discarded
on unmount/account transitions. Late reads are ignored. Responses include the
verified owner, which the client checks before accepting data. Cross-tab change
messages carry no health payload; each tab reauthorizes its own read. No personal
records, chat context or tokens are written to demo IndexedDB/local storage.

## Server authorization and integrity

`src/app/astronaut/health-actions.ts` reuses the SSR cookie client, calls `getUser`
on every request, requires confirmed email, then loads the profile by verified
Auth user ID. Client-supplied owner/source properties are ignored. Private pages
also check access independently; signing out protects all personal routes.
Next.js Server Actions retain their same-origin protections and account routes
remain private/no-store. No service-role key or privileged database connection is
used. The existing forced RLS policies remain the database enforcement boundary.

`SupabaseHealthRepository` implements the existing repository abstraction:

- Reads filter `astronaut_profile_id`, page through larger histories and sort by
  original submission time then UUID. Unexpected owner/source rows are rejected.
- Creates use a stable submission UUID and `user-entered` source. A retry confirms
  the existing owned row and matching input rather than inserting a duplicate or
  overwriting a collision. A save is reported only after an owned read confirms it.
- Updates whitelist mutable measurements/date/notes, require explicit review,
  and filter both UUID and owner plus the original `updated_at` timestamp. A stale
  or concurrent edit is rejected. Identical retry values need no second update.
- Deletes require confirmation and filter UUID, owner and original update time;
  exactly one deleted row must be confirmed. Another owner's and missing rows
  receive the same unavailable response.
- Existing database triggers preserve creation time and immutable identity, and
  set update time. Application writes never send new ownership, source, original
  submission time, or creation time during editing.

No new migration is needed: the three existing migrations contain all required
columns, constraints, indexes, triggers, grants and ownership policies. No migration
file was changed in Phase 6C. Legacy invalid oxygen remains visible for review;
editing such a row requires an intentional valid replacement or blank value. It is
not repaired automatically.

## Tests and limits of evidence

- `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`.
- `npm run test:auth:e2e`: isolated loopback fictional Auth/Data API on port 4400,
  separate Next.js instance on 3102; exercises account and personal workflows on
  desktop/mobile. Does not touch the real Supabase project.
- `npm run test:e2e`: existing desktop/tablet/mobile demo regression suite. Can
  run against a local production build via `PLAYWRIGHT_BASE_URL`.
- `npm run test:no-key:e2e`: separate no-configuration server that explicitly
  masks public Supabase variables, without reading/rewriting `.env.local` values.
  Checks friendly account configuration states and demo-record preservation.
- Unit authorization tests mock the backend, including owner tampering, cross-user
  reads/writes/deletes, null/invalid measurements, paging, lost insert responses,
  stale edits and optimistic concurrency. These are application tests, not actual
  PostgreSQL policy execution.

The prepared `supabase/tests/ownership.sql` contains 30 assertions. It has not been
run for Phase 6C. A suitable authorized disposable Supabase SQL environment was
not supplied. Do not run its fixture account inserts or extension setup against a
live project containing user accounts. To verify safely, provision an approved
disposable local Supabase stack, apply the existing migrations there, then run
`supabase test db`. This is a manual gate, not permission to execute SQL here.

Live two-account RLS isolation, real cross-device health retrieval, actual refresh/
revocation behavior and the complete real cloud workflow are not claimed verified.
Before collecting personal medical information, review applicable privacy,
retention, deletion, access/audit and clinical-suitability requirements. This remains
a research prototype, not a verified professional identity or clinical system.

## Production checklist — separate approval required

Local verification on 15 November 2026:

- ESLint, TypeScript and production build passed.
- 224 unit tests passed, including negative ownership and integrity checks.
- 20 mocked authenticated desktop/mobile browser tests passed.
- 33 desktop/tablet/mobile demo regression tests passed on the local production build.
- Six no-key desktop/tablet/mobile browser tests passed, including demo preservation.
- No final assertion failures remain. The development fixture server logged
  canceled-request `ECONNRESET` messages during rapid scripted navigation; the
  server continued and the affected workflows passed. Real SQL/RLS execution and
  live cross-device cloud behavior are still unverified.
- The source scan found no credential patterns or sensitive candidate files;
  `.env.local` is ignored and untracked. No migration or production settings were
  changed, and Git HEAD remains the existing Step 6A commit (no commit/push/deploy).

1. Review this local diff, the test results and secret scan. Keep `.env.local`,
   browser snapshots, reports and generated fixture files out of Git.
2. Run the 30 SQL assertions in the approved disposable environment. Test actual
   users A and B with normal public-key/JWT requests: anonymous denial, owner CRUD,
   tampered IDs, stale edits, session expiry, logout/back, and cross-device retrieval.
3. Verify the existing live schema matches all three migrations, with correct RLS,
   grants and API exposure. Do not replay migrations or execute corrective SQL
   without specific approval. No additional migration is proposed here.
4. Obtain explicit permission before committing, pushing, changing Vercel settings
   or deploying. Prior phase approvals do not authorize this release.
5. In the existing Vercel project, only after approval, privately configure the
   public project URL/publishable key and production `APP_URL`; confirm exact
   production Auth callback URLs/email templates. Never add privileged keys or
   enable Groq as part of this release.
6. Commit the reviewed changes to the existing repository, push approved `main`,
   and verify the exact SHA reaches Ready on the existing production URL.
7. Test approved production test-account workflows and owner isolation, preserving
   existing browser-local demo data. Report failures and roll back to the previous
   verified deployment if necessary; do not claim success until verified.
