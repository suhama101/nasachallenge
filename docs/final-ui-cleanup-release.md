# Final minimal UI cleanup release

Approved scope: remove normal Demo navigation to the unfinished Crew Profile and improve shared chart styling. Production baseline: `4d6a5582b301ca0c2f08072f9436fd8f98f2402d`. No other application work is included.

## Exact UI files

1. `src/components/app-shell.tsx` — remove the Crew Profile sidebar item; replace the sidebar crew-card and topbar avatar links with non-interactive identity displays. Crew name, initials, role and mission information are retained. `/crew-profile` and Astronaut Mode My Profile are unchanged.
2. `src/components/chart-palette.ts` — shared presentation palette: coral heart rate, violet sleep, turquoise oxygen, amber temperature, indigo systolic, pink diastolic, soft orange fatigue and green exercise. Mood remains categorical; no numeric mood chart is introduced.
3. `src/components/health-charts.tsx` — three-pixel series, outlined point markers and hover emphasis, restrained existing gradient fill, readable ticks/tooltips, colored card edges, and corrected textual pressure-series color labels. Dates, units, exact tables and data selection are unchanged.
4. `src/components/insights-analytics.tsx` — matching shared line/point styles, chart-card accents, readable tooltip/tick/legend presentation. All current/baseline, trend, completeness and timeline data remain unchanged.
5. `src/app/phase8.css` — chart-only visual polish for top accents, unit badges, captions and legend labels. Existing page layout and educational content remain unchanged.

Necessary tests/documentation only:

- `tests/e2e/final-ui-cleanup.spec.ts` — all six remaining sidebar links work with keyboard navigation; placeholder links are absent; identity and the direct legacy route remain; chart colors, line widths, point counts, tables, contrast, responsive fit and saved demo snapshots are checked.
- `tests/e2e/journey.spec.ts` — replace the obsolete expectation for the deliberately removed avatar link with absence of placeholder links and presence of the retained initials.
- `tests/auth-e2e/phase8-polish.spec.ts` — verify the matching personal History point styling, pressure colors and updated legend without inventing a line for a single point.
- `tests/auth-e2e/personal-health.spec.ts` — verify the matching personal Insights line color/width and six actual fixture points.
- `docs/final-ui-cleanup-release.md` — this release record.

## Integrity and verification

A snapshot of 171 tracked files and a TypeScript syntax audit confirm no unexpected protected-file changes. Calculation statements in TrendChart, HealthCharts and InsightsAnalytics match the baseline. Chart data, axes, sorting/filtering inputs, formatters, null-gap flags, animation flags and exact table content match. No series or source points were added. The health algorithms, ownership, validation, database/schema/RLS, authentication/Proxy/session handling, profile/onboarding, storage, API integrations, environment files and deployment settings are unchanged. All eleven educational topics and NASA/CSA source content remain intact.

The first public test run exposed one obsolete keyboard assertion in three viewports that required the now-intentionally-removed avatar link. That expectation was corrected to require absent links and retained identity. This was an expected UI-test update, not an authentication, data or navigation failure. Deployment is gated on the final complete test rerun.

Final pre-release results:

| Check | Actual result |
| --- | --- |
| ESLint | Passed |
| TypeScript | Passed |
| Production build | Passed, 34 generated pages including the retained legacy route |
| Unit tests | 238 passed, 10 files |
| Complete public/demo browser rerun | 63 passed, desktop/tablet/mobile |
| Complete authenticated fixture browser suite | 40 passed, desktop/mobile |
| Complete no-key browser suite | 6 passed, desktop/tablet/mobile |
| Unique browser tests | 109 passed, no remaining failures |
| Additional local production-build smoke suite | 62 passed, desktop/mobile |

Series colors pass 3:1 contrast against chart surfaces, and tick text passes 4.5:1. Point counts, exact tables, missing values, legacy invalid oxygen, zero/one-record states, five-earlier-day eligibility, profile navigation and private/demo separation are covered. All five major NASA/CSA resource pages were reopened successfully; no research content was changed. Screenshots under ignored `test-results/final-ui-cleanup-verified/` contain isolated synthetic demo data only.

The production smoke suite checks the requested public entry pages, every remaining sidebar link, the absence of Crew Profile links, public History/Insights chart styling, educational guidance and all six anonymous personal-route redirects at desktop and mobile sizes. It performs no real signup, login, recovery-email request or cloud-record mutation.

## Remaining manual verification

Authenticated browser tests use a fictional loopback Supabase fixture, not production accounts. They do not prove live two-account RLS isolation or email delivery. Privately sign in with an existing confirmed account, open My Profile without saving changes, view History and Insights, and refresh to confirm the session and existing records remain available. No new check-in or credentials shared with the agent are needed. Actual devices, a full screen-reader audit and browser-chrome zoom remain manual; responsive and keyboard checks run automatically.

No production private records are accessed or changed. No sensitive file belongs in the explicit commit allowlist. `.env.local` remains ignored; generated fixture type references are restored before committing. No Supabase or Vercel environment configuration is altered.

## Release and rollback

Release only after all checks pass, via the existing GitHub main branch and automatic Vercel integration. Verify the exact pushed commit is Ready and the existing `https://missionpulse.vercel.app` alias resolves to it, then run production smoke tests.

Rollback reference: `4d6a5582b301ca0c2f08072f9436fd8f98f2402d`; preserve it as the local tag `missionpulse-pre-final-ui-cleanup`. Retained production deployment: `https://missionpulse-3xq2fd0ag-suhamas-projects.vercel.app`, ID `dpl_6csSLWbxWkmaz34WsiTgqkdFekpq`.

If rollback is needed, pause further main pushes and run from the linked MissionPulse project:

```powershell
npx vercel promote https://missionpulse-3xq2fd0ag-suhamas-projects.vercel.app --scope suhamas-projects
npx vercel inspect https://missionpulse.vercel.app --scope suhamas-projects
```

Verify the baseline deployment ID is Ready and serves the production alias, then recheck public routes. This does not revert GitHub main; separately review and test a Git revert if a source rollback is needed. No database, records or environment rollback is required. No rollback is performed during a successful release.
