# Crew medical-support and preventive education

Scope: a static extension of the existing shared measurement guide, already used on personal Insights, demo Insights and Space Health Knowledge. No record-dependent assessment, clinical threshold, risk score, API, contact service, database or navigation change is included.

Baseline `5aca322be27a9fd83560f02ebebf9c74c2ef1c81` was preserved before editing as local tag `missionpulse-pre-crew-guidance`. Development branch: `feature/missionpulse-crew-guidance`.

## Evidence review and boundaries

Official pages were opened and relevant content reviewed before editing. Earlier guessed/unavailable URLs were excluded; only the verified destinations below are used. Source facts are explicitly labeled “NASA context” or “Source-supported context.” Review prompts, next steps and discussion cues are explicitly general educational suggestions, not validated clinical decision rules. Mission-specific approved procedures and the qualified team take precedence.

| Area | Supported context and exact source | General suggestion and limits |
| --- | --- | --- |
| Medical support | [NASA Health and Medical Care](https://www.nasa.gov/reference/3-0-health-and-medical-care/), sections 3.1/3.4; [CSA Medical support](https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/medical-support.asp), flight surgeon/crew medical officer roles and in-flight support | Discuss persistent concerns, symptoms, uncertain readings or difficulties with duties through established medical channels. This is a non-exhaustive discussion prompt, not a NASA-approved checklist, emergency cutoff or triage algorithm. |
| Sleep/rest | [NASA Inadequate Sleep and Irregular Schedules](https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/) | Review the mission-approved work/rest routine and recorded disruptions; discuss persistent difficulties. No universal sleep duration or light/caffeine intervention is prescribed. |
| Physical activity | [NASA Reduced Cardiorespiratory and Musculoskeletal Fitness](https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/) | Use the mission-prescribed countermeasures; discuss difficulties rather than changing intensity from an app chart. No exercise target or training regimen is supplied. |
| Food/fluid monitoring | [NASA Water Quantity, section 6.3.2](https://www.nasa.gov/reference/6-0-natural-and-induced-environments-vol-2/); [NASA Inadequate Food and Nutrition](https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/) | Review the assigned food/fluid plan and any difficulties with the team. The optional water field is not a dietary assessment. No intake quantities, supplements, fluid-loading procedure or nutrition prescription is supplied. |
| Well-being/communication | [NASA Behavioral Changes and Psychiatric Disorders](https://www.nasa.gov/reference/risk-of-behavioral-changes-and-psychiatric-disorders/) | Review available mission communication/support options and discuss persistent distress or functional difficulties. Mood entries are not a mental-health screening result. |
| Consistent monitoring | [NASA Standard Measures](https://www.nasa.gov/reference/standard-measures/) | Check dates, units and conditions; leave unmeasured optional entries blank. These are general recording suggestions. MissionPulse is not the Standard Measures research protocol and the source does not validate its software statistics. |

The urgent-report warning was moved intact from the old guide footer into the support panel. New text states that observations are not diagnoses, a baseline change alone does not establish an emergency, urgent concerns should be communicated promptly using established channels, and the app cannot monitor the user, assess an emergency, dispatch help or arrange a consultation. The “Consult crew medical support · when and how” control is an informational disclosure, not a communication button. The two links jump to existing measurement explanations and preventive considerations. No self-triage or treatment instruction is added.

All eleven original topics and their original sources are retained byte-for-byte at the declaration level. Their What/Why/How/Next/help content remains unchanged. The five established challenge-listed NASA/CSA links remain available.

## Exact changed files

1. `src/components/crew-health-guidance.tsx` — static support panel and five expandable considerations with eight verified source links.
2. `src/components/indicator-guide.tsx` — reuse the new shared section, relocate the original warning intact, add the existing-topic anchor.
3. `src/app/phase8.css` — scoped, responsive styles for the educational section only.
4. `tests/e2e/crew-guidance.spec.ts` — public/demo guidance, source destinations, keyboard, mobile and zoom-equivalent checks.
5. `tests/auth-e2e/insights-clarity.spec.ts` — guidance remains available across zero, one, two and six fictional records, without changing records.
6. `tests/auth-e2e/personal-health.spec.ts` — guidance limits remain visible with and without the existing explicit urgent report.
7. `docs/crew-guidance-release.md` — evidence mapping, verification and rollback record.

## Verification

A snapshot of 173 tracked files finds no unexpected protected-file changes. Charts, health/statistical calculations, thresholds, validation, data ownership, storage, API integrations, auth/session/Proxy, signup/onboarding/profile, migrations/RLS and configuration files are untouched. Syntax checks confirm all eleven original topics and original source definitions are unchanged and the old urgent warning is reused intact.

Required suites completed before committing:

| Check | Actual result |
| --- | --- |
| ESLint | Passed |
| TypeScript | Passed |
| Production build | Passed, 34 generated pages |
| Unit tests | 238 passed, 10 files |
| All public/demo browser tests | 66 passed, desktop/tablet/mobile |
| All authenticated fixture browser tests | 40 passed, desktop/mobile |
| All no-key browser tests | 6 passed, desktop/tablet/mobile |
| Unique browser tests | 112 passed; no application test failures |
| Additional local production-build smoke suite | 66 passed, desktop/mobile |

Coverage includes guidance with zero, one, two and six records; non-urgent and explicit urgent-report states; null/legacy invalid measurements; record snapshots; all eleven original topics; the eight new source destinations; native keyboard disclosures; responsive/zoom-equivalent scrolling; auth/protected routes and demo isolation. Focused desktop/mobile screenshots were visually reviewed. An initial quoting error in the ignored smoke harness was corrected before its checks could execute; no application assertion or application code failed as a result. The unchanged fixture cancellation/color warnings do not cause test failures.

The supplemental smoke suite checks the existing public pages, sidebar destinations, charts, eleven topics, guidance disclosures/source links and all six anonymous personal-route redirects. It performs no real signup, login, email request or cloud-record mutation. Screenshots/traces contain fictional fixture data and remain ignored.

No `.env.local`, credentials, privileged keys, private records or migration belongs in the explicit commit allowlist. Generated fixture type references are restored before committing. Production settings and database configuration are not altered.

## Limitations and private manual check

This is educational context plus general recording/review suggestions. It is not medical assessment, triage, clinical validation, NASA endorsement or an individual care plan. The source references do not authorize personal treatment or provide MissionPulse escalation thresholds. No medical communications integration exists.

Authenticated automated tests use fictional loopback services; live two-account RLS isolation, real email delivery and all real-account session scenarios are not inferred. Actual devices, browser-chrome zoom and a full screen-reader audit remain manual. Privately sign in, refresh personal Insights, confirm existing records remain available, and open the support/prevention disclosures. No new health entry is needed and no credentials should be shared with the agent.

## Release and rollback

Only after every required check passes: commit the reviewed files, safely fast-forward main, push to the existing repository, wait for the existing automatic Vercel production deployment, verify the exact Git SHA is Ready and serves `https://missionpulse.vercel.app`, then run the public smoke suite there. Stop on a critical regression; do not access production private records.

Rollback baseline: `5aca322be27a9fd83560f02ebebf9c74c2ef1c81`. Retained deployment: `https://missionpulse-gajuihp9w-suhamas-projects.vercel.app`, ID `dpl_4xX6KpvJHbHBknaxx6iwab5TVmGB`.

If rollback is needed, pause further main pushes and run from the linked MissionPulse project:

```powershell
npx vercel promote https://missionpulse-gajuihp9w-suhamas-projects.vercel.app --scope suhamas-projects
npx vercel inspect https://missionpulse.vercel.app --scope suhamas-projects
```

Verify the baseline deployment ID is Ready and serves the production alias, then check public routes. This does not revert GitHub main; separately review/test a source revert before subsequent pushes. No records, SQL, RLS or environment rollback is needed. No rollback is performed during a successful release.
