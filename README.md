# MissionPulse

**Your Health Companion Beyond Earth**

NASA Space Apps Challenge 2026

**Challenge:** Create Health Monitoring Software for Astronauts on Space Missions

[**Live application**](https://missionpulse.vercel.app) · [**Explore Demo — no account needed**](https://missionpulse.vercel.app/demo) · [**GitHub repository**](https://github.com/suhama101/nasachallenge)

MissionPulse helps people record health observations, review changes over time, and understand their measurements through space-health education. It combines a public fictional demonstration with a separate, authenticated personal workspace.

> A research-informed educational prototype, not a clinically validated medical system. MissionPulse does not diagnose, prescribe treatment, assess emergencies, or replace qualified medical professionals. NASA and Canadian Space Agency references provide educational context, not endorsement.

## The challenge

Long-duration spaceflight exposes crews to five interconnected hazards identified by NASA's Human Research Program:

| Hazard                          | Why it matters                                                      |
| ------------------------------- | ------------------------------------------------------------------- |
| Space radiation                 | Radiation exposure can affect crew health.                          |
| Isolation and confinement       | Restricted environments can affect well-being and team functioning. |
| Distance from Earth             | Communication delays and limited resupply complicate support.       |
| Gravity fields                  | Changing gravity conditions affect the body and its adaptation.     |
| Hostile and closed environments | Crews depend on controlled habitats and life-support systems.       |

Accessible records and understandable explanations can support observation and informed discussion. They cannot replace mission-approved monitoring or medical care. See [NASA's five hazards](https://www.nasa.gov/hrp/hazards/) and [human spaceflight risks](https://www.nasa.gov/hrp/risks/).

## Our solution

**Record → Review → Understand → Learn → Seek Support**

MissionPulse connects everyday health recording with clear visual explanations and source-linked learning. Its support guidance explains how to discuss concerns through established medical channels; it does not contact a medical team, monitor the user, or dispatch help.

### Two separate experiences

|                       | Explore Demo                                                       | Astronaut Mode                                                  |
| --------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| Getting started       | Open the demo without registration.                                | Create and confirm an account, sign in, and complete a profile. |
| Records               | Fictional examples and locally saved demo entries.                 | Measurements entered by the signed-in user.                     |
| Storage               | This browser's IndexedDB, separate from cloud accounts.            | Supabase-backed personal profiles and health records.           |
| Insights              | Fictional records or isolated demonstration scenarios.             | The account owner's records.                                    |
| Educational assistant | Available with a no-key fallback; optional access to demo context. | Does not read personal cloud health history.                    |

NASA/CSA resources are a third, distinct source of information: research and educational references, **not an astronaut patient dataset imported into MissionPulse**. Demo records are never automatically copied into a personal account.

## Key features

- **Daily health check-ins:** record heart rate, blood pressure, temperature, sleep, exercise, mood, and fatigue. Optional entries include oxygen saturation (SpO₂), blood glucose, water intake, symptoms, and notes.
- **Personal accounts and cloud history:** email/password signup, email confirmation, sign-in, password recovery, profile onboarding, and personal record creation, review, editing, and deletion. Server-side owner checks and database Row Level Security support account separation; this is not a security certification.
- **Readable charts and history:** colorful interactive visualizations with exact values, missing-data explanations, and gaps retained instead of invented measurements.
- **Beginner-friendly Health Insights:** distinct zero-record, one-record, and multi-record experiences. Personal baseline comparisons require at least five usable earlier mission dates within the preceding 30 days; the current date is excluded. A single record does not establish a trend.
- **Data-quality handling:** optional unmeasured values remain missing. Legacy invalid zero SpO₂ entries are labeled **Needs review** and excluded from calculations, rather than silently rewritten.
- **Space-health learning:** 17 searchable/filterable NASA/CSA knowledge entries and 11 expandable measurement topics explaining What, Why, How, spaceflight context, and next steps.
- **Medical-support education:** “When Should I Ask for Medical Support?” distinguishes recorded observations from diagnosis and explains the application's limits.
- **Five preventive considerations:** sleep/rest, mission-prescribed activity, hydration/nutrition, well-being/communication, and consistent recording. General suggestions are distinguished from source-supported context; these are not individualized prescriptions.
- **Public fictional scenarios:** A, B, and C use separate synthetic datasets without overwriting saved demonstration records.
- **Educational assistant:** source-linked retrieval and a deterministic fallback work without a Groq key. Chat persistence is browser-local and separated by demo dataset. Optional live Groq is constrained to approved content and requires private configuration; unrestricted medical advice is not supported.
- **Responsive interface:** desktop, tablet, mobile, keyboard navigation, and zoom-equivalent layouts are covered by automated checks. A complete assistive-technology audit remains a separate manual task.

For statistical details and limits, see [analysis methodology](docs/analysis-methodology.md) and [SpO₂ data integrity](docs/spo2-integrity.md).

## How MissionPulse works

### Try it without registering

1. Open [Explore Demo](https://missionpulse.vercel.app/demo), then enter the demo overview.
2. Review the fictional crew member's sample history, or record a fictional check-in.
3. Open Health History and Health Insights to see measurements, charts, and data-quality explanations.
4. Explore scenarios A/B/C and the source-linked educational assistant.
5. Open Space Health Knowledge to search topics and read the measurement and medical-support guidance.

A fresh demo browser is initialized with fictional sample check-ins. Demo data stays on that browser and origin; clearing browser storage or intentionally resetting the demo removes it. Scenario selection does not overwrite saved records. No real health measurements are needed to evaluate the demonstration.

### Use the personal workspace

1. [Create an account](https://missionpulse.vercel.app/auth/signup), confirm the email, and [sign in](https://missionpulse.vercel.app/auth/login).
2. Complete profile onboarding and open the compact Mission Overview.
3. Record an observation, then review it in personal Health History.
4. Open personal Health Insights for summaries, explanations, and baseline comparisons when sufficient valid history exists.
5. Use My Profile and source-linked guidance as needed. For account recovery, use [Forgot password](https://missionpulse.vercel.app/auth/forgot-password).

Personal routes under `/astronaut` require authentication. Public demo, knowledge, and assistant routes remain separate from personal cloud records.

## Technology stack

Verified against [package.json](package.json) and the implementation:

| Technology                              | Role                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Next.js 16, React 19, TypeScript        | App Router pages, server rendering/actions, and typed application logic.                               |
| Tailwind CSS 4, Radix UI                | Styling and interface primitives.                                                                      |
| Supabase JavaScript SDK and SSR package | Authentication, session integration, and personal database access.                                     |
| Recharts                                | Interactive health visualizations.                                                                     |
| Zod                                     | Structured input validation.                                                                           |
| IndexedDB                               | Browser-local demo records and conversations.                                                          |
| Lucide React, Inter via Fontsource      | Interface icons and locally bundled typography.                                                        |
| Groq SDK; optional Upstash REST service | Optional constrained assistant provider and shared request limits; not required for the demo fallback. |
| Vitest, fake-indexeddb, Playwright      | Unit, browser-storage, and browser workflow testing.                                                   |
| ESLint, Prettier                        | Code checks and formatting.                                                                            |
| Vercel                                  | Hosting for the existing public Next.js application.                                                   |

Dependency versions are resolved in [package-lock.json](package-lock.json). Browser-local persistence does not imply a fully offline application or a medical-device connection.

## NASA and space agency resources

These official resources inform the application's explanations and knowledge links:

| Agency                                      | Resources                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NASA Human Research Program                 | [Five hazards](https://www.nasa.gov/hrp/hazards/) · [Risks](https://www.nasa.gov/hrp/risks/) · [Ongoing research](https://www.nasa.gov/hrp/ongoing-hrp-research/)                                                                                                                                                                                                                               |
| NASA measurement and care references        | [Standard Measures](https://www.nasa.gov/reference/standard-measures/) · [Health and Medical Care](https://www.nasa.gov/reference/3-0-health-and-medical-care/)                                                                                                                                                                                                                                 |
| Canadian Space Agency                       | [Monitoring radiation and astronaut health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp) · [Why conduct science experiments in space?](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp) · [Medical support](https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/medical-support.asp) |
| NASA sleep and fitness                      | [Inadequate sleep and irregular schedules](https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/) · [Reduced cardiorespiratory and musculoskeletal fitness](https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/)                                                                                                         |
| NASA environment, nutrition, and well-being | [Natural and induced environments](https://www.nasa.gov/reference/6-0-natural-and-induced-environments-vol-2/) · [Inadequate food and nutrition](https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/) · [Behavioral changes and psychiatric disorders](https://www.nasa.gov/reference/risk-of-behavioral-changes-and-psychiatric-disorders/)                                  |

These sources do not validate MissionPulse's software calculations or establish personal clinical thresholds. Source-supported facts and general educational suggestions are labeled separately in the application.

## Local development

Use a current Node.js environment; the application release was tested with **Node.js 24.x and npm**. Run commands from the directory containing `package.json`:

```sh
git clone https://github.com/suhama101/nasachallenge.git missionpulse
cd missionpulse
npm ci
npm run dev
```

Open **http://localhost:3000** and choose Try Demo. **Supabase and Groq credentials are not needed for Explore Demo.** If PowerShell blocks the npm script wrapper, use `npm.cmd` instead of `npm`.

### Optional: connect your own personal workspace

Personal accounts require a separately configured Supabase project. Copy `.env.example` to `.env.local`, then supply your own values for the names used by the current code:

```ini
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
APP_URL=<your-local-app-origin>
```

For the default development server, the local app origin is `http://localhost:3000`. The code also accepts `NEXT_PUBLIC_SUPABASE_ANON_KEY` as a legacy alternative to the publishable key. Use the project's publishable/anonymous client key, **never a service-role key or database password**. Restart the development server after changing local configuration.

The database must have the existing [migrations](supabase/migrations/) applied in filename order, with email authentication and allowed redirect URLs configured for the chosen origin. Review the [Astronaut Mode setup notes](docs/astronaut-mode-setup.md) and [session and recovery notes](docs/session-and-release.md) before configuring your own project; older phase-specific status statements in those documents are historical. Do not run SQL against an existing production database merely to try the public demo.

`.env.local` and other sensitive local environment files are Git-ignored. Keep credentials out of commits, screenshots, browser reports, and shared logs. Groq is optional and remains disabled without explicit private configuration; see [assistant safety and configuration](AI-SAFETY.md). No production environment changes are needed to run the no-key demo locally.

## Testing and quality

The application baseline documented here is deployed commit **`fad5a2bf839fd8a421c796eeaeba59404999332e`**. The [latest application release report](docs/crew-guidance-release.md) records:

| Check                                          | Recorded result                               |
| ---------------------------------------------- | --------------------------------------------- |
| ESLint, TypeScript, production build           | Passed; build generated 34 pages.             |
| Unit tests                                     | 238 passed across 10 files.                   |
| Public/demo browser tests                      | 66 passed across desktop, tablet, and mobile. |
| Authenticated fixture browser tests            | 40 passed across desktop and mobile.          |
| No-key browser tests                           | 6 passed across desktop, tablet, and mobile.  |
| Unique browser tests                           | **112 passed.**                               |
| Additional local production-build smoke checks | 66 passed across desktop and mobile.          |

The associated production verification artifact also recorded **66 successful public smoke checks** against the live website: 54 public-page passes and 12 expected anonymous sign-in redirects. That artifact is intentionally ignored rather than published as a repository asset. These are historical application-release results, not a claim that application suites were rerun for this documentation-only update.

Coverage includes zero/one/multiple records, missing and legacy-invalid values, scenario separation, protected-route redirects, all eleven measurement topics, educational guidance, links, keyboard interaction, and responsive layouts. Authenticated automation uses **fictional loopback fixtures**, not real Supabase accounts. Public production checks do not read or mutate private cloud records. They do not prove live two-account RLS isolation, real email delivery, every real-account session scenario, or complete screen-reader accessibility.

To reproduce application checks locally:

```sh
npm run lint
npm run typecheck
npm run build
npm test
npm run test:e2e
npm run test:auth:e2e
npm run test:no-key:e2e
```

Browser configurations use installed Microsoft Edge. Run the authenticated and no-key suites sequentially because they share a local test port. Keep test fixtures on local test services; do not redirect record-writing tests at production. Existing personal records should be checked privately by their owner, without sharing passwords or recovery tokens.

## Scientific and technical limitations

- No diagnosis, prescription, automated emergency assessment, or replacement for crew medical professionals.
- No medical-device integration, radiation dosimetry, live astronaut telemetry, or real astronaut patient dataset.
- No official NASA clinical approval, certification, or endorsement.
- Baselines and software-generated summaries describe available entries; they do not establish clinical normality, causation, fitness for duty, or a validated risk score.
- Public demonstration data is fictional. Personal entries are user supplied and may be incomplete or inaccurate.
- The assistant is educational and demo-scoped; it does not provide personal cloud-record consultation or arrange medical communications.
- Device testing, complete accessibility review, real email/session scenarios, and live two-account database-isolation testing require additional manual verification.

For urgent concerns, use established emergency or mission medical channels. MissionPulse cannot monitor a person, assess an emergency, or dispatch assistance.

## AI-Assisted Development Disclosure

**ChatGPT and Codex assisted with planning, code development, refinement, testing, documentation, and presentation preparation.** Team MissionPulse directed, reviewed, and tested the work. The team does not claim to have independently written every line of AI-assisted code.

Repository asset review found no tracked raster images, audio, or video. The standalone application icon is a code-defined SVG; interface icons come from Lucide and typography from Inter. This documentation does not certify the SVG's generation provenance or the compliance of presentation materials outside this repository. Genuine local test captures are ignored and are not substituted with generated dashboard mockups.

**Submission review still required:** confirm the current 2026 [NASA Space Apps terms](https://www.spaceappschallenge.org/legal/) and [participant resources](https://www.spaceappschallenge.org/resources/) for AI attribution, asset metadata, and any visible watermark requirements. Those official pages could not be reliably retrieved during this documentation audit, so current-rule compliance is not certified. Review any separate presentation assets as well as code, and apply the current requirements before submission.

## Team

**Team MissionPulse**

- Suhama Mustafa
- Ashja Shahid
- Fatima Zulfiqar

## Future possibilities — not currently implemented

- Integration with validated medical devices.
- Mission medical-communication integration.
- Expert-reviewed clinical evaluation.
- Testing with representative spaceflight-health scenarios beyond the current fictional demonstrations.

These are possible future directions, not deployed capabilities or validated outcomes.

## Credits and acknowledgments

NASA and the Canadian Space Agency provide the research and educational resources linked above. Their inclusion does not imply sponsorship of this project, endorsement, or clinical validation.

MissionPulse uses the third-party software listed in the technology table and dependency manifests, including Next.js, React, TypeScript, Tailwind CSS, Supabase, Recharts, Zod, Radix UI, Lucide, Fontsource/Inter, Groq SDK, Vitest, Playwright, and their supporting packages. Upstream licenses continue to apply: Lucide includes ISC and Feather-derived MIT notices, and Inter is distributed under the SIL Open Font License 1.1. Retain applicable dependency notices when distributing materials.

No project-level license file is currently provided. The team should confirm the intended source/material licensing and submission permissions against the current challenge terms; this README does not grant a new license or certify submission eligibility.

### Further technical documentation

- [Latest application release evidence and rollback reference](docs/crew-guidance-release.md)
- [Analysis methodology](docs/analysis-methodology.md)
- [Personal health implementation notes](docs/phase-6c-personal-health.md)
- [SpO₂ integrity and missing-data handling](docs/spo2-integrity.md)
- [Authentication sessions and recovery](docs/session-and-release.md)
- [Demo walkthrough](docs/demo-script.md)
- [Assistant safety boundaries](AI-SAFETY.md)
- [Deployment notes](DEPLOYMENT.md)

Phase-specific documents preserve development history. This README describes the implemented application baseline identified above; historical plans are not additional feature claims.
