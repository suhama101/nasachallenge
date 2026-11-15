# Approved Phase 8 and Phase 9 release

This records the final pre-release checks for the owner-approved release to the existing `suhama101/nasachallenge` repository and `missionpulse` Vercel project. Earlier Phase 8/9 review reports remain historical audit records describing the work before release approval.

## Included and unfinished scope

Included: compact authenticated Mission Overview; mint, blue and violet action cards; refined chart colors, legends and tooltips; eleven source-linked What/Why/How/Next educational topics; preserved missing-data, insufficient-history and legacy SpO₂ explanations. The homepage and all existing routes are retained.

Not implemented in this release: an additional compact profile-onboarding redesign, new signup/login UI enhancements such as password visibility, and removal of the demo-header avatar/other demo decoration. Existing onboarding, authentication and demo interfaces retain their working behavior. Only the reviewed personal-overview repetition was removed. These unfinished items are not claimed as complete.

No new auth fix was implemented. The owner reported a successful production sign-in with the correct profile. That verifies one account's attempt; the earlier intermittent failure remains unexplained. The generic auth error-reporting limitation remains unchanged.

## Checks rerun before committing

| Check | Result |
| --- | --- |
| ESLint | Passed |
| TypeScript | Passed |
| Production build | Passed, 34 generated pages |
| Unit tests | 238 passed, 10 files |
| Public/demo/guidance browser tests | 57 passed |
| Mock auth/session/personal-record/overview browser tests | 36 passed |
| No-key browser tests | 6 passed |
| Total browser tests | 99 passed |
| Additional local production-build read-only smoke checks | 40 passed, desktop and mobile |

Desktop dashboard checks include 1366×768 and 1440×900, with zero, one and two fictional records; mobile and effective 200%-zoom layouts preserve natural scrolling. Existing CRUD, ownership, protected-route/session/recovery, record persistence, demo isolation, date filtering, keyboard, null/missing and SpO₂ tests pass. The five primary NASA/CSA source pages were reopened successfully; the guide's exact links and eleven expandable topics are checked by the browser suites.

All 67 frozen functionality-critical files match the pre-Phase-8 hashes. Auth/session/Proxy, server actions, Supabase clients, ownership, RLS/schema/migrations, validation, dates/statistics, repositories and environment configuration are unchanged. The Phase 9 snapshot and AST audit also confirm unchanged data/handler expressions and preserved Phase 8 charts/guidance. No new package or unrelated application feature is included.

Changed/new files were reviewed and scanned for credential, token, private-key and database connection-string patterns. No potential secrets were found. `.env.local` remains ignored; no environment file, database migration, real user-data export or diagnostic artifact is included. The incidental test-generated `next-env.d.ts` reference was restored before committing.

## Production verification gate

After main is pushed, wait for the existing automatic Vercel production deployment. Verify its Git SHA equals pushed main, Ready status, and the unchanged `https://missionpulse.vercel.app` alias. Then run the prepared read-only smoke script on the actual production URL. It checks public entry pages, enabled auth forms, CTA navigation, card/chart styling, the eleven-topic guide/five source links, and anonymous redirects for all personal routes.

The agent does not sign into a real account, submit cloud health measurements, request recovery emails, alter environment values, or run production SQL. Production record availability, real session persistence, email delivery and live two-account RLS isolation are not inferred from mocks. The release changes no stored-data schema, identifiers or persistence code and performs no production record mutation.

## Private post-release checklist

1. Open `https://missionpulse.vercel.app/auth/login` and sign in privately with an existing confirmed account.
2. Review the compact Mission Overview, correct profile and count; refresh and confirm the session remains authenticated.
3. Open History and Insights and confirm existing records are still available. No new test record is required.
4. Sign out, then visit `/astronaut/health-history` and confirm sign-in is required.
5. Only if recovery is needed, use `/auth/forgot-password`, follow the latest email link privately, set a new password and sign in again. Do not share credentials or reset/verification links.

Physical devices, actual browser-chrome zoom and a full screen-reader audit remain manual. Browser tests use Edge contexts; authenticated automated tests use isolated fictional services.

## Rollback reference and procedure

- Baseline commit: `348d160255c8f3ac1c5955a93c9da3e4149f3e57`.
- Baseline Vercel deployment: `dpl_4Hgc6JeHdbnNaqN98dK3oZogiHmt`.
- Baseline deployment URL: `https://missionpulse-nqppmudge-suhamas-projects.vercel.app`.
- Local rollback tag: `missionpulse-pre-phase8-9`.

If rollback becomes necessary, pause further main pushes and, from the linked MissionPulse project using the same Vercel account/scope, promote the retained baseline deployment:

```powershell
npx vercel promote https://missionpulse-nqppmudge-suhamas-projects.vercel.app --scope suhamas-projects
npx vercel inspect https://missionpulse.vercel.app --scope suhamas-projects
```

Confirm the alias resolves to the baseline deployment ID, Ready status and baseline SHA, then verify public routes. No SQL or environment rollback is needed. GitHub main still contains the new source after an immediate deployment rollback; review a separate Git revert and its checks before subsequent pushes if the source must also revert. Do not reset or force-push main. No rollback is performed during a successful release.
