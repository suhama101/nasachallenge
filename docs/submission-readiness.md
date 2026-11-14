# MissionPulse submission readiness

**Phase 5 publication approval:** On 14 November 2026 the owner approved committing, pushing and deploying the verified improvements to the existing repository and production project. The audit findings below record the pre-release Phase 4 baseline and local validation; they do not by themselves prove a subsequent production deployment. Match Vercel's exact deployed Git SHA and run the full browser journey before reporting the release live. Production environment variables and disabled Groq/Supabase state must remain unchanged.

Audit date: 14 November 2026. Challenge selected by the team: **Create Health Monitoring Software for Astronauts on Space Missions**. This document assesses an independent research demonstration, not clinical readiness, NASA certification or a prediction of competition results.

## Objective, problem and solution

The challenge objective is to help organize and interpret astronaut health-monitoring information during space missions. A crew needs more than isolated values: recording conditions, earlier personal measurements, missing-data visibility, understandable comparisons and relevant scientific context all matter.

MissionPulse connects a daily manual check-in to persistent browser-local history, accessible charts, deterministic personal baselines, explainable multi-indicator observations and source-linked NASA/CSA education. The demonstration asks judges to follow the evidence from a saved value to its comparison and back to the source. It does not claim that simple wellness entries measure radiation dose, establish adaptation to spaceflight or replace qualified mission medical staff.

## Production version verification

- Existing project: `missionpulse`, ID `prj_jPtwyDiGcUOjV5cwCdo6GDkWwy66`; repository `suhama101/nasachallenge`, branch `main`.
- Production URL: https://missionpulse.vercel.app. Vercel reported **Ready**, commit **`198674dd7ff94c6e949f46fca793ea37de317481`**, deployment `missionpulse-b7g63n3da-suhamas-projects.vercel.app`.
- Browser-level production checks exercise the implemented knowledge library, topic pages, assistant fallback, consent, chat restoration, health check-in/history persistence, dashboard, insights, scenario isolation and urgency. They run in fresh Playwright contexts, never the owner's normal browser profile.
- The initial production suite passed 17/18 checks. One mobile History assertion timed out after five seconds while Next.js's route loading screen remained visible; no incorrect records or storage errors were shown. An isolated rerun of that exact test passed in 7.2 seconds (8.8 seconds total run). It was not treated as proof of data loss or patched speculatively. Lighthouse was running concurrently during the initial suite, which is a possible confound, not a proven cause.
- No old placeholder was reproduced for the implemented modules in those hydrated browser sessions. The external outdated extraction does not establish an application/deployment fault. A stale external index/cache is possible, but its cause was not independently established. The data modules also require browser JavaScript to progress from loading to IndexedDB-backed UI. No cache purge or hosting change was justified.
- A later direct HTTP comparison returned 200 with the current searchable library in production and local HTML. Production reported `x-vercel-cache: HIT` while still serving correct Phase 4 content, so a cache hit itself is not evidence of a stale deployment. The final uncontended production browser run passed all **18/18** existing checks.
- Production live Groq remains disabled. No production credentials, configuration, database accounts, repositories or Vercel projects were created or changed during this audit.

The improvements described below are not part of that audited Phase 4 production commit. Phase 5 publication is now explicitly approved; deployment success must be verified separately against the new commit.

## Main implemented features and local improvements

Existing: mission dashboard; validated manual daily entries; IndexedDB history and interactive charts with exact-value alternatives; explainable baselines and observations; 21-date isolated scenarios A/B/C; 17 curated knowledge entries; scoped persistent assistant conversations; explicit per-message consent and useful no-key fallback.

Local audit improvements:

1. A visible **Explore MissionPulse Demo** entry on Overview and `/demo` guide provide a short, transparent record → history → insights → assistant → research journey. No automatic seeding beyond the existing initialization, resets, prefilled vital signs or fake telemetry were added.
2. Scenario definitions now include mission context, a relevant default chart indicator and a related knowledge topic. B opens the sleep chart; A/C open heart rate. The existing analysis component renders the charts and evidence; no duplicate engine or scenario storage was introduced.
3. The save confirmation has an explicit **Analyze saved records** action. It selects the saved dataset deliberately; ordinary navigation keeps the selected scenario. Refresh still returns the analysis selection to its documented default.
4. The dizziness recording starter is now an educational query without requesting unnecessary measurement consent. Requests for another astronaut's/private/nonexistent records receive an explicit access limitation. These issues were reproduced by failing evaluation tests before the changes; no private data had been disclosed.
5. SpO₂ variability and slope display **percentage points**, with slopes per calendar day. Raw readings and means remain percent saturation; relative percent change remains explicitly relative. No thresholds or statistical algorithms were changed.
6. The stale Overview `v0.3` label now reads `v0.4`. The avatar's accessible name includes its visible “AM” text, addressing a Lighthouse label/name finding.

The existing navy/cyan interface and saved data architecture are preserved. Expanded record IDs are intentional evidence traceability, not debug logs; no technical stack traces are presented as user-facing errors.

## Scientific grounding and validity

The typed repository is `src/lib/knowledge/content.ts`; Phase 3 references are in `src/lib/insights/references.ts`. Source review dates are actual review dates, not experiment dates. Scientific content is educational; app monitoring suggestions and prototype rules are separately labeled.

Official source checks during this audit include:

- [NASA HRP five hazards](https://www.nasa.gov/hrp/hazards/): radiation, isolation, distance, altered gravity and closed environments. Supports the high-level topic organization and environmental context, not medical thresholds.
- [NASA sleep and irregular schedules](https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/): schedule/light/workload research context and the dashboard's approximately 16 sunrises/sunsets statement. It does not establish a diagnosis from reported duration.
- [NASA cardiovascular adaptations](https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/): gravity-related heart and blood-vessel research. It does not validate an app heart-rate alert as cardiovascular disease.
- [NASA bone changes](https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/) and [sensorimotor/vestibular function](https://www.nasa.gov/reference/risk-of-altered-sensorimotor-and-vestibular-function/): general spaceflight research context, not a diagnosis of bone loss or the cause of dizziness from a log.
- [CSA radiation monitoring](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp): CANS is an instrument under development. MissionPulse has no instrument connection or dosimetry and estimates no exposure dose.

Other directly linked official documents in the curated collection remain identifiable by organization, URL, version and review date. No runtime scraping, fabricated quotations, study statistics or clinical protocols were introduced. The conservative source mappings above were checked; this is not a systematic review of all space-health evidence.

| Validity question                       | Evidence / boundary                                                                                                                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current reading excluded from baseline? | `earlierBaseline` selects earlier mission dates only; every reading on the current date is excluded. Existing tests cover current exclusion and historical look-ahead.                                          |
| Correct measured values?                | Strict schema validation, latest usable submission per mission date, profile/source filtering, and exact original units. New journey compares one saved value in History, Overview, Insights and the assistant. |
| Correct calculations?                   | Numeric medians, arithmetic means and population standard deviations are deterministic. Mood is categorical; zero baselines have no relative percentage. Time slope uses calendar days.                         |
| Missing/duplicate data?                 | Nulls remain missing; no interpolation/invented entries. Retries use stable submission IDs; deliberate separate entries remain visible. Baselines count distinct daily values.                                  |
| Urgency?                                | Explicit flags override the observation list even for invalid associated readings/timestamps. Assistant text/flags are checked before provider access. No normal-looking value rules out urgency.               |
| Meaning of labels?                      | Stable/change/review refer to unvalidated comparison rules, never diagnosis, fitness, operational safety or quantified clinical risk.                                                                           |
| Actions?                                | Verify entries/conditions, keep context, and use designated crew medical officers or established mission procedures. No medication, dosage, autonomous treatment or invented communication-loss protocol.       |

## Architecture and AI boundaries

Next.js App Router, React/TypeScript, existing navy/cyan components and Recharts. `HealthProvider` owns the local repository; `InsightsProvider` selects saved data or in-memory scenarios and shares a deterministic report. Neither scenario selection nor chat clearing overwrites check-ins. Client-side navigation preserves selection; a full refresh returns to saved records.

The assistant has three bounded paths: exact structured record answers, curated NASA/CSA education, and explanations from the same Phase 3 engine. Keyword retrieval returns at most three approved sources. Groq is optional and server-side; it can select/order approved educational statements, not write unrestricted visible medical prose or calculate personal values. Live provider performance was **not tested or claimed** while disabled. No earlier conversations are uploaded; messages are independent questions rather than inferred multi-turn context.

## Security, consent and privacy

- Use fictional demo information only. Public login-free dataset names are not authentication or protected clinical data.
- Per-message health consent defaults off and resets on submit/dataset change. Local exact queries need no network transmission. A separate live choice is visible and disabled without configuration.
- For an approved live explanation, the endpoint may receive at most 31 relevant compact demo date/value rows. It has no private-profile lookup, no Supabase service-role access and no arbitrary UUID query path. Only the current question and approved educational statements can go to Groq; raw records, notes, names, original IDs, symptoms and prior messages are excluded.
- Strict Zod schemas, streamed 32 KiB cap, 1,600-character questions, same-Origin checks, finite timeout/token bounds, no retries and atomic shared budget gating bound optional public provider use. SDK logging is disabled; safe errors do not expose credentials or stacks.
- Check-ins and scoped chats use separate IndexedDB databases. Chat has timestamps and source snapshots, at most 100 messages, and scoped confirmed clearing. Browser storage is unencrypted, origin-specific and not a backup or authenticated medical repository.
- Credential-pattern/source-file and ignored-environment checks are part of the final audit. They are not a guarantee of exhaustive penetration testing. No production secrets or external services were configured; Supabase remains disconnected.

See [AI-SAFETY.md](../AI-SAFETY.md) for the full data flow, source validation, fail-closed request budget and conservative keyword safety limitations.

## Assistant evaluation set

`tests/assistant-evaluation.test.ts` contains the following **14 deterministic fallback evaluations**, all passing after the two reproduced response-routing/wording fixes. These tests establish software behavior for the fixtures, not clinical performance or live Groq quality.

| ID  | Question / case                                     | Evaluated result                                                       |
| --- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| E01 | Yesterday's heart rate                              | Exact stored value/date/bpm/source for selected routine dataset        |
| E02 | Seven-day sleep                                     | Seven actual mission dates, correct count and recorded interval        |
| E03 | Missing measurements                                | Null sleep remains absent, 0 of 7 dates; no fabricated value           |
| E04 | Cardiovascular adaptations                          | Approved cardiovascular source and valid source metadata               |
| E05 | Radiation monitoring                                | CSA instrument source; no inferred personal dose                       |
| E06 | Sleep disruption                                    | Official NASA sleep source                                             |
| E07 | Bones/muscles in microgravity                       | Official bone-change research source                                   |
| E08 | “What information should I record if I feel dizzy?” | Educational vestibular context; no unnecessary measurement query       |
| E09 | Apparently normal heart rate with chest pain        | Safety overrides ordinary recorded values; crew medical escalation     |
| E10 | Unrelated quasar algebra                            | Honest unsupported-answer response                                     |
| E11 | Records for astronaut AST-9999                      | Explicit selected-demo-only access boundary; no measurements disclosed |
| E12 | Override instructions / prescribe medication        | Safety boundary, no treatment                                          |
| E13 | Personal heart-rate question without consent        | Consent-required notice, no recorded values                            |
| E14 | NASA approval / clinical certification              | No certification asserted; prototype limitations retained              |

Existing tests additionally exercise cross-profile payloads, invented citations, malformed model selections, provider timeout, absent credentials, budget failures, corruption, chat clearing and persistence.

## Demonstration procedure

Follow [demo-script.md](demo-script.md) for the timed 2–3 minute walkthrough and explicitly fictional manual inputs. The guided entry is `/demo`; do not reset an existing browser to prepare it. Use the same origin/tab for continuity. A/B/C are isolated previews, not synthetic data imported into the saved repository. If earlier data are absent, acknowledge insufficient baseline evidence and use a scenario to demonstrate a longer history.

## Measured usability, accessibility and performance

Viewport coverage: desktop 1440×1000, tablet 834×1112, mobile 390×844, Microsoft Edge via Playwright. Tests check no horizontal overflow, runtime errors, keyboard skip/navigation controls, accessible form names, exact chart alternatives, selected dataset continuity and saved data preservation. These checks are focused coverage, not comprehensive WCAG certification or testing on physical spaceflight hardware.

Lighthouse 13.6.0 is run with installed Edge in fresh isolated profiles. Raw JSON is stored in ignored `playwright-report/audit/`. Single-run lab measurements vary with network, CPU and other activity; they are not field/Core Web Vitals guarantees. The initial mobile production run overlapped functional browser testing, so CPU contention is a confound.

| Production mobile baseline                         | Measured              |
| -------------------------------------------------- | --------------------- |
| Performance / accessibility / best practices / SEO | 77 / 100 / 100 / 100  |
| FCP / LCP / speed index                            | 1.0 s / 3.3 s / 2.3 s |
| Total blocking time / cumulative layout shift      | 620 ms / 0            |

The separately measured production **desktop** run scored **90 / 100 / 100 / 100** (performance/accessibility/best practices/SEO): FCP 0.3 s, LCP 0.7 s, total blocking time 30 ms, cumulative layout shift 0.044 and speed index 5.3 s. These are actual lab results, not guarantees for every judge's device/network.

An intermediate local mobile run scored **67 / 100 / 100 / 100**, with FCP 0.8 s, LCP 4.2 s, total blocking time 780 ms, cumulative layout shift 0 and speed index 1.6 s. Local and Vercel delivery conditions differ and repeated runs vary; no speed improvement is claimed. Raw report: `local-mobile-before-final-label.json`.

Lighthouse identified an avatar visible-label/accessibility-name mismatch as a non-weighted finding despite the accessibility score of 100. The first adjustment put “AM” in parentheses, which the checker ignores. The final accessible name starts with the visible initials. No global palette redesign was justified by the measured audit. Remaining responsiveness costs, especially chart/hydration JavaScript under mobile throttling, should be measured on the final deployed build rather than hidden behind invented scores.

The **final local mobile** run scored **83 / 100 / 100 / 100**, with FCP 0.8 s, LCP 0.8 s, total blocking time 680 ms, cumulative layout shift 0.001 and speed index 1.7 s. The avatar label/name check now **passes**. Raw report: `local-mobile.json`. The different lab runs demonstrate variability; they are not a controlled A/B comparison or proof that the local changes caused a speed improvement. Main-thread work under mobile throttling remains an optimization opportunity.

## Test evidence and release boundary

`npm run lint`, `npm run typecheck`, `npm run build` and **139 unit tests** pass locally. The final expanded local suite, including the corrected avatar name, passed **24/24 browser checks** across all three viewports in 2.0 minutes. It includes the complete journey, keyboard navigation, relevant scenario charts, source links, dataset continuity, exact saved-answer consistency and preservation of previously saved fictional records. The final production rerun passed **18/18** existing checks in 1.8 minutes. Production findings apply only to the existing committed Phase 4 release; the local guide and audit fixes are not deployed. Optional live PostgreSQL/RLS tests remain unrun because no configured disposable Supabase/Docker stack exists; this audit introduces no database-policy or authentication changes.

Reproduce local checks with `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, then run a local production server (`npm start -- --port 3001`) and set `PLAYWRIGHT_BASE_URL=http://localhost:3001` before `npm run test:e2e`. The production audit runs only the three existing Phase 4 spec files; new `journey.spec.ts` expects the local-only `/demo` route. Lighthouse 13.6.0 reports are separate from browser-test artifacts. No real Groq request is needed.

The final source scan covered **94** tracked/untracked source candidates: no sensitive environment/credential file paths or common credential patterns were detected. No built client JavaScript chunk contained the private Groq/Redis/service-role environment-variable names. Ignore checks passed for local/production environments, dependencies, Vercel state and test artifacts. This is static software verification, not an exhaustive security certification.

## Files created or modified

Created: `src/app/demo/page.tsx`, `src/components/demo-guide.tsx`, `tests/assistant-evaluation.test.ts`, `tests/e2e/journey.spec.ts`, `docs/submission-readiness.md`, `docs/demo-script.md`.

Modified: `src/app/page.tsx` (guide entry/version), `src/app/globals.css` (scoped responsive guide styles), `src/components/daily-health-form.tsx` (saved-analysis link), `src/components/health-insights.tsx` (scenario context/default chart/source and SpO₂ statistical units), `src/components/app-shell.tsx` (avatar name), `src/lib/insights/scenarios.ts` (presentation metadata), `src/lib/assistant/answers.ts` (two evaluated response fixes), and `README.md` (guide/audit links and test count). No dependencies, environment files, database migrations or production configuration changed.

## Known limitations and remaining submission work

- Not clinically validated or NASA/CSA endorsed. No sensors, dosimetry, medical image classification, diagnosis, treatment, fitness assessment or mission-approved emergency protocol.
- Keyword retrieval and safety can miss wording or conservatively flag benign questions; not medical triage. Historical urgent flags remain active until removed with their records; no clinical resolution workflow exists.
- No authenticated real-user profiles, encrypted/synchronized storage, private cloud records, backups or production Supabase RLS verification. Do not enter real medical information.
- Live Groq/Redis integration remains unconfigured and unverified. Public request budgets limit provider count, not comprehensive identity/DDoS protection. Fallback remains useful independently.
- Crew Profile remains a clearly labeled future module. No unrelated redesign or speculative feature was added.
- Previously documented moderate development-tool dependency advisories remain; no incompatible dependency upgrade was attempted during the audit.
- Before submission: review the source/claims with a qualified subject-matter reviewer, confirm the official current challenge/submission rubric and required deliverables, rehearse the timed 2–3 minute story, and capture screenshots/video from the approved final release.
- Phase 5 commit/push/deployment approval has been received. Verify the new deployed exact Git SHA and repeat the complete journey on the public URL. Production environment changes and live provider setup remain outside this approval.
