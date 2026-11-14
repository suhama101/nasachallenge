# Phase 4: scientific grounding and AI boundaries

MissionPulse is an independent, login-free demonstration, not a NASA-approved medical system. Use fictional data only. It cannot diagnose, prescribe, assess fitness for duty, estimate radiation exposure or replace crew medical procedures.

## Architecture and evidence

`src/lib/knowledge/content.ts` contains 17 versioned, typed educational entries. Source pages were fetched and reviewed on 2026-11-14; this is a source review date, not an experiment date or independent clinical validation. The repository contains conservative paraphrases, no invented quotations or statistics. NASA HRP [hazards](https://www.nasa.gov/hrp/hazards/), [risks](https://www.nasa.gov/hrp/risks/), [ongoing research](https://www.nasa.gov/hrp/ongoing-hrp-research/) and the directly linked individual risk pages provide NASA context. CSA sources are [radiation monitoring](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp) and [space research](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp). The CANS instrument is described as under development, never as connected telemetry.

Monitoring suggestions and indicator mappings are MissionPulse context, not quotations or medical protocols endorsed by those agencies. Each topic displays limitations, organization, direct official URL, version and review date. Sources may evolve; review entries and their version/date together when editing. No runtime website scraping occurs.

Retrieval tokenizes the current question, applies a small alias map, scores titles/keywords/body text, and returns at most three source documents. It is lexical retrieval, not semantic understanding or an exhaustive scientific literature review. Unknown questions return an honest evidence limitation. Topic pages work with no provider or database configuration.

## Deterministic facts and bounded Groq use

The browser answers exact measurement questions without a provider: yesterday or the last 7/30 UTC mission dates, numeric means and first-to-last differences, categorical mood, or completeness of the nine Phase 3 indicators. It uses the latest valid submission per mission date and preserves missing values. Baseline explanations reuse the Phase 3 engine. Requests are standalone; pronouns referring to a previous turn are not resolved.

Optional `POST /api/assistant` uses the official Groq SDK. The configured model must currently support JSON-object output. Groq selects/orders relevant approved educational statement IDs; it does not author unrestricted visible prose. This deliberate constraint reduces medical hallucination risk but limits conversational flexibility. Measurement values and statistical observations are always supplied by deterministic code, never invented by the model. Only unique allowlisted IDs are accepted; extra model fields, nonexistent citations and arbitrary prose cause a curated fallback. Canonical source metadata accompanies answers and is validated again before persistence. Retrieved text and user prompts are data, never executable instructions; there are no tools or provider request chains.

## Consent and data flows

- By default, records are excluded. A checkbox opts into selected demo measurements for **one** message and resets on submit or dataset change. Urgent boolean flags are checked locally even without measurement consent, so no provider can suppress escalation.
- All ordinary education and supported exact record answers can stay in the browser. Live selection requires a separate visible checkbox. Merely opening the page sends a configuration-status GET, not records or conversation content.
- For a consented live explanation, the browser sends the current question and at most 31 compact relevant date/value rows, source labels, analysis timestamp, baseline size and urgent boolean to the MissionPulse endpoint. Names, notes, symptoms, original UUIDs, glucose/water and unrelated indicators are excluded. The server rebuilds an isolated demo context and reuses the analysis engine.
- **Groq receives only the current question and up to three approved educational statement texts/IDs. Raw measurements, derived personal observations, profile IDs, names, notes, symptoms and previous chat messages are never included.** The user must still avoid entering personal information into the question itself. Provider account retention settings are outside this app's control.
- Dataset enums route the four fixed fictional contexts; they are not authentication. The endpoint never looks up a private profile and has no Supabase dependency or service-role access. Arbitrary profile identifiers and unknown fields are rejected. It does not claim ownership of public demo data.
- Chat is stored in a separate local IndexedDB database (`missionpulse-chat-demo-v1`), scoped to saved/A/B/C, capped at 100 messages, with timestamps and source snapshots. Clearing needs confirmation and affects only that conversation. No history is uploaded automatically. Storage is not encrypted clinical infrastructure; other scripts or users with access to the same browser profile may access it. Clearing site data removes it.

## Safety, availability and abuse controls

Urgent keyword reports and selected urgent flags short-circuit before provider configuration, budget checks and network calls. The response prioritizes the designated crew medical officer and established mission emergency procedures. If communication is unavailable, no substitute treatment is invented. A single apparently normal measurement never rules out an emergency. Clinical requests and common instruction-override prompts receive a boundary response.

Keyword guards are conservative and unvalidated. They can miss unusual wording and trigger on educational or negated mentions. They are not clinical triage, and cannot assess severity. There is no mission-approved emergency protocol, sensor data or clinician review connected.

POST requires same Origin (including scheme/port), same-origin Fetch Metadata where present, JSON content type, a streamed 32 KiB body limit and strict Zod validation. Questions are bounded to 1,600 characters, compact history to 31 rows, retrieved documents to 3 and output to 256 tokens. SDK retries are disabled; provider requests time out after 8 seconds, budget requests after 2.5 seconds. Responses disable caching and omit sensitive exception detail. No health records, API keys or prompts are logged by application code.

Public live calls additionally require an atomic shared Upstash Redis request budget, so Vercel instances share limits. Defaults are 6 requests/minute and 100/day (UTC); configurable caps cannot exceed 20/minute and 500/day. Each attempted provider call consumes one allowance even if it fails. Redis stores only time-bucket counter keys, not IPs, questions or health information. A missing or unavailable budget fails closed to local fallback. This bounds provider call count, not a guaranteed monetary amount; account-level spending limits remain recommended. Same-origin checks are not identity verification: malicious clients can forge headers or exhaust the shared allowance, causing live availability loss for other judges. No-key local mode remains useful and incurs no provider cost.

Missing configuration, network/provider failures, invalid model JSON and exhausted budget all produce labeled deterministic/curated answers. Groq-origin text is never silently substituted for validated data. Storage corruption is surfaced and preserved until an explicit clear; no fake save is reported.

## Verification and remaining limits

Unit tests mock provider plans, timeout/error paths, budget failures, consent, sources, request validation, exact arithmetic, baseline consistency, profile separation and IndexedDB. Browser tests cover three viewport sizes and the earlier workflows. No real Groq completion is required or claimed verified without an owner-provided configuration. Model compatibility, account retention, network availability and real rate-budget provisioning require an optional configured integration check. Live Supabase authentication/RLS remains outside this phase.
