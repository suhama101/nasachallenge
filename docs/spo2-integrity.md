# SpO₂ integrity investigation and local fix

Base release: `6ff2b11131e386ca34528e160800bd1e6f70f70f`. The investigation below records pre-release reproduction and local validation. On 14 November 2026 the owner approved committing, pushing and deploying verified Step 6A to the existing repository and Vercel project. Deployment success must be established separately by matching the exact production Git SHA, Ready status and public browser checks. This approval does not authorize authentication, production environment changes, Supabase configuration or Groq enablement.

## Reproduced root cause

A fresh isolated browser entered the reported fictional fixture: 92 bpm, 4.5 hours sleep, 36.8 °C, 118/76 mmHg, fatigue 7/10 (plus required mood/exercise). With SpO₂ blank, the previous form returned “Enter a number.” Entering an explicit `0` then succeeded. IndexedDB contained numeric `spo2: 0`; History and Insights displayed `0 %`.

The previous HTML input allowed `min=0`, `checkInInputSchema` used `inputNumber(0,100)`, and stored-record validation also allowed zero. Serialization and retrieval preserved the value; displays and analysis treated it as ordinary evidence. The confirmed cause is **zero being accepted as a new measurement**, not a reproduced blank-to-zero conversion. The normalization helper already handles empty/whitespace input before numeric conversion, and null rendering already says “Not recorded.” No SpO₂ zero default was found.

The reproduction establishes this code path, not how the owner's original browser record acquired its value. No existing owner browser profile was inspected, cleared or repaired. Raw reproduction output is an ignored artifact under `playwright-report/integrity-investigation/`.

## New data contract

| Case                                                   | New write                    | Existing record / display                                                                                |
| ------------------------------------------------------ | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| Blank / whitespace / omitted / null SpO₂               | Accepted as `null`; optional | “Not recorded”; chart gap; no zero or replacement                                                        |
| Number from 1 to 100, including decimal                | Exact entered number         | Original percent saturation and source/date                                                              |
| Zero, negative, above 100, malformed/non-finite number | Clear inline error; no save  | Stored schema still reads historical zero for review, rather than making the entire history inaccessible |
| Historical stored zero                                 | Cannot be newly submitted    | Original `0 %` shown with **Needs review**; never rewritten/deleted automatically                        |

The 1–100 rule is a broad input contract, **not a normal range, clinical risk threshold or device-validity certification**. Examples are fictional, not targets. Sleep, exercise, fatigue and water retain their distinct meaningful-zero behavior. The required-fields completion check excludes optional SpO₂; analysis completeness still reports availability of all nine monitored indicators, not required-form completion or medical reliability.

`health/integrity.ts` centralizes read-only interpretation. History and dashboard retain the original zero with a review label. The analysis engine constructs a separate usable-data view where only uncertain oxygen evidence is excluded; it returns the original records/current entry unchanged, and adds an explicit limitation. Baselines, means, trends, counts and observations do not use that zero. Other valid readings from the same check-in remain available. Charts show gaps, preserve original values in exact-value tables, and explain review exclusions. The assistant uses the same rule and shows original-zero review context rather than including it in arithmetic. Urgent reports still override statistics.

For consistency with the new input contract, historical fractions below 1% also receive review flags with their exact original value preserved. An omitted historical SpO₂ property is interpreted as absent on read, never as zero, and is not automatically written back. No clinical inference is made from these data-entry checks.

No record migration runs on page load. Record IDs, timestamps, notes, source, other measurements, the IndexedDB name/version and the initialization marker are unchanged. Existing reset remains confirmed/destructive and does not restore deleted seeds. There is no new record editing/deletion feature: users can review the original and deliberately add a new check-in; the original is retained.

## Input and history usability

The form now has explicit required/optional labels, per-field explanations, fictional placeholder examples, visible units, mobile numeric input modes and linked help/error descriptions. Numbers validate on blur and submit; values remain entered after errors. The error summary names fields in plain language. The synchronous duplicate-submit guard and stable retry ID remain intact. Save confirms addition and date without redirecting, with **View Health History**, **View Health Insights** and **Record another check-in** choices.

History explains mission date versus submission time, date filtering, counts, missing values and opening individual records. Each summary counts recorded/missing/review-needed measurements. A log shortcut avoids scrolling through every advanced chart. Existing filters, exact tables, charts, notes and provenance remain available; empty ranges do not present a dead log shortcut.

## Verification

Deterministic unit coverage includes valid/decimal SpO₂, optional blanks/null/omission, invalid zero/ranges/non-numbers, JSON and future database mapping, IndexedDB reopening, stable-ID retries, preserving prior rows, legacy-zero reads, no reseeding after reset, original-record immutability, excluded arithmetic/baselines/timelines, unchanged valid-zero semantics elsewhere, assistant consistency and urgent overrides. The existing required-SpO₂ assertion was removed to match the explicitly optional contract; the other required-field tests remain.

New browser coverage exercises blank/zero/valid form flows, correction without losing values, success navigation, duplicate submit, refresh, History/Dashboard/Insights missing rendering, actual oxygen point counts, original-zero review and untouched stored rows in isolated contexts. Existing scenario, demo, knowledge, assistant, keyboard and mission-journey suites remain part of the full run. No production deployment success is implied.

Final local results: **lint passed**, **TypeScript passed**, **production build passed**, **168 unit tests passed** (six files), and **33/33 browser checks passed** in 2.4 minutes across desktop, tablet and mobile. New coverage contains 30 unit cases and three browser workflows at each viewport; one old required-SpO₂ case was intentionally removed for the optional contract. Desktop/mobile form screenshots were visually reviewed. A source scan covered 99 tracked/untracked candidates without finding sensitive file paths or common credential patterns. The prior Git HEAD remains unchanged and nothing is staged.

The local production-build server is available at `http://localhost:3001/daily-health-check` and `/health-history`. Browser-local records are origin-specific; this preview does not import production browser data. All test fixtures used isolated temporary contexts, not the owner's existing browser profile. Optional PostgreSQL/RLS integration tests remain unrun because no disposable Supabase/Docker stack is configured, and this step must not configure one.

## Files affected

- `src/lib/health/integrity.ts`: new shared read-time review, display and coverage helpers.
- `src/lib/health/validation.ts`, `selectors.ts`: optional strict write contract, legacy-compatible read contract, completeness and usable averages.
- `src/lib/insights/analyze.ts`, `src/lib/assistant/answers.ts`: separate usable analysis view, preserved original records, explicit review and consistent arithmetic.
- `src/components/daily-health-form.tsx`, `health-history.tsx`, `health-charts.tsx`, `health-insights.tsx`, `insights-analytics.tsx`, `metric-card.tsx`, `demo-status.tsx`, and `src/app/globals.css`: form/help/navigation, history summaries and quality labels/plot exclusions, plain-language copy and responsive styles.
- `tests/spo2-integrity.test.ts`, `tests/e2e/spo2-integrity.spec.ts`: new focused unit and browser regressions. Existing `tests/health.test.ts` reflects optional SpO₂; `tests/e2e/check-in.spec.ts` and `journey.spec.ts` use the clearer navigation labels.
- `README.md`, `docs/demo-script.md`, this report and `docs/astronaut-mode-plan.md`: updated contract and future-mode handoff.
- `eslint.config.mjs`: excludes generated, Git-ignored browser reports/test artifacts/coverage from linting; application and test source remain linted. This prevents local diagnostic helper scripts from being treated as application code.

## Future accounts and limitations

See [astronaut-mode-plan.md](astronaut-mode-plan.md). Existing Supabase SQL permits zero and is not connected; a reviewed **new** migration and actual RLS tests are required before authenticated activation. This step changes neither production schema nor configuration. Data-quality review is not clinical triage. Browser storage is local and unencrypted, and live Groq/Supabase remain unconfigured. Historical zeros remain flagged until an explicit, reviewed correction workflow exists; none is performed automatically.
