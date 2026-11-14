# Phase 3 monitoring methodology

This is a deterministic, local research prototype. Synthetic tests verify software behavior, **not medical accuracy**. No clinical validation, diagnosis, risk score, treatment recommendation or NASA endorsement is claimed. All thresholds below are proposed software settings for demonstrations, not NASA clinical standards.

## Input and isolation

`analyzeHealthRecords(records, options)` is a pure TypeScript function. It receives an explicit UTC `asOf` instant and a selected profile ID, rather than reading a wall clock internally. The shared Insights provider computes one report for the dashboard observation panel and Health Insights. No health records or notes are sent to an AI service or any other third party.

Only records for the exact selected profile enter the report. Demo mode accepts `synthetic` and `user-entered-demo` sources; future authenticated mode accepts only `user-entered`. Other profiles/sources are counted and excluded, never used as substitute baselines. Scenarios use separate UUIDs and in-memory arrays, never IndexedDB writes.

Records pass the existing Zod schema before statistical use. Invalid vital signs, enum values, calendar dates and timestamps are rejected. Future submission/created/updated instants or mission dates are excluded. Identical repeated IDs are deduplicated; conflicting versions of an ID are excluded, with counts reported. No invalid value is repaired, guessed or interpolated. Corrupt IndexedDB records cause the existing safe storage-error state and are preserved; the engine also validates unknown input defensively.

All comparisons use **one most recently submitted check-in per mission date**, with UUID ordering only as a deterministic timestamp tie-breaker. The original history preserves all check-ins. The current analysis record is the latest usable **mission date**, not necessarily the latest submission timestamp. Thus a newly submitted backdated entry may lead the Phase 2 dashboard measurement cards while an entry on a later mission date leads the analysis. The dashboard observation panel and Insights always share the same report.

## Baseline

- Reference window: the 30 calendar days strictly before the current analysis record's mission date. All entries on the current mission date are excluded, even if submitted earlier that day.
- Default minimum: **5 distinct earlier usable dates per indicator**. The UI permits 3, 5, 7 or 10; the engine permits integer minima 3–30 and windows 1–90 days. Each indicator independently excludes its missing values.
- Numeric baseline: rolling median of all usable values in the window. An even sample count can legitimately produce a half-step median. No current reading is included in its own baseline.
- Mood baseline: historical modal category; ties are resolved by the most recent occurrence among tied categories. Mood has no assigned numeric ranking, arithmetic average, slope or percentage change.
- The sample count, actual first/last reference dates, source labels and all baseline records are inspectable. Below the configured minimum, display **Insufficient baseline data**, not a provisional stable comparison.
- Outliers are retained. A value is annotated as statistically distant when its distance from the median exceeds `max(3 × 1.4826 × MAD, 3 × indicator absolute-change setting)`. This annotation is descriptive; it does not certify invalidity or influence exclusion. The median reduces sensitivity to extremes but is not a clinically established physiological baseline.
- Mixed synthetic/user-entered demo baselines are explicitly labeled. They must not be treated as an actual astronaut's baseline. Recent history may reflect adaptation, reporting changes or other confounding factors; a median alone cannot explain them.

## Window statistics

Statistics are computed for the 7 and 30 mission dates ending on the explicit analysis date. Missing values/dates remain absent and are not zeros. Means use available values and display their sample counts. Population standard deviation describes available 7-day values and is withheld below two values. Linear least-squares slope uses actual elapsed calendar days and requires at least three distinct dates; it is not a forecast. Statistical results are rounded for display, without changing the underlying rule evaluation.

Relative change is `100 × (current − baseline) / abs(baseline)`. It is undefined when the baseline is zero; absolute changes still work. A relative percentage is descriptive and is not the change trigger for every indicator. SpO₂ absolute changes use **percentage points**, distinct from relative percent.

Consecutive changes require adjacent mission dates and a nonmissing value at each step. Missing dates or readings interrupt the sequence. Repeated baseline deviations are assessed separately against each day's own earlier baseline; later values never enter an earlier comparison.

## Proposed comparison rules

| Indicator          | Prototype absolute change                     | Additional rule                                          |
| ------------------ | --------------------------------------------- | -------------------------------------------------------- |
| Resting heart rate | At least 8 bpm                                | Relative difference must also be at least 10%            |
| Sleep duration     | At least 1 hour                               | No universal percentage rule                             |
| Temperature        | At least 0.5 °C                               | No universal percentage rule                             |
| SpO₂               | At least 2 percentage points                  | Not a relative-percent threshold                         |
| Systolic pressure  | At least 15 mmHg                              | Evaluated separately from diastolic                      |
| Diastolic pressure | At least 10 mmHg                              | Evaluated separately from systolic                       |
| Fatigue            | At least 2 rating points                      | Self-report; not a validated clinical scale              |
| Exercise           | At least 20 minutes                           | Duration does not establish exercise workload or fitness |
| Mood               | Current category differs from historical mode | No invented numeric mood distance                        |

A numeric change can meet its indicator's rule either against the baseline or as the total monotonic change across the latest three consecutive dates. These settings do not screen for physiological reference-range abnormalities. A persistently concerning absolute value could resemble its baseline; statistical similarity cannot establish health or safety.

Categories describe the evidence, not the astronaut:

- **Stable compared with baseline:** usable recent current data and enough baseline data, with no stated change rule triggered. It does not mean medically normal or safe.
- **Change observed:** an indicator's configured comparison or sustained-change rule is met.
- **Review suggested:** the same-direction baseline rule is met on at least three consecutive dates, or a supported multi-indicator pattern appears. For mood, a changed category must repeat on consecutive dates with an adequate earlier mode for each date.
- **Insufficient information:** current measurement absent, earlier baseline too small, invalid analysis clock or stale data. No numeric health observation is generated from insufficient evidence.

Freshness uses a **prototype**, nonclinical rule: submission no older than 48 hours by default, and current mission date less than two UTC calendar days old. Mission date age and submission age are shown separately because the app does not know a device measurement time. The engine can configure the submission-hour window. No present-condition observations are made for stale records.

## Co-occurrence and historical timeline

The following patterns use actual paired records and never imply causation:

- Last three consecutive mission dates: sleep falls at both steps by at least 1 hour in total and fatigue rises at both steps by at least 2 points in total. Both numeric indicators need earlier baselines.
- Last three consecutive mission dates: exercise falls at both steps by at least 20 minutes in total and fatigue rises at both steps by at least 2 points in total, again with earlier baselines.
- A higher heart-rate comparison meeting the heart-rate rule alongside an explicitly reported `stressed` mood in the current check-in.

One observation per indicator is produced, plus distinct supported co-occurrence cards. IDs and ordering are deterministic; there is no duplicate stable/change card for the same indicator. Cards distinguish measurements, comparison periods, limitations, software rules, educational references and monitoring actions.

The timeline recomputes reports using only submissions available by each historical UTC date cutoff, with that date's current record and earlier baselines. Late backdated entries do not appear before their submission time. The timeline uses today's chosen configuration, so it is a recomputation, **not** a stored clinical audit log or record of settings previously in force. Counts in charts are observation counts, not risk levels.

## Urgent reports and medical procedure boundary

Phase 3 adds an explicit **user-declared urgent-symptom flag**. It is not inferred by an unvalidated threshold or a free-text model. Selecting the flag in the form immediately displays the crew-procedure fallback, before saving. Saved flags persist in IndexedDB; old Phase 2 records load with `false` by default. An additive, unapplied Supabase migration prepares the same boolean field for a future authenticated store.

An urgent flag in the selected profile/source cohort overrides the observation list, even if the associated numeric reading or timestamp is unusable. The dashboard shows the urgent report instead of statistical reassurance; the Insights table withholds ordinary category labels. The message is: **seek immediate assessment through the crew's established medical emergency procedure; do not wait for another statistical result or check-in**. No approved medical protocol is configured here and no treatment instructions are generated.

The prototype does not record resolution of urgent symptoms, so it never silently expires a flag. Older or malformed flagged records therefore still prompt assessment rather than automated reassurance. Free-text notes and ordinary symptom names are not screened for emergencies. A missing flag is not an assessment that no emergency exists. Future operational use needs clinician-reviewed protocols, resolution workflows, governance and validation.

## Scenarios and mission context

`A · Routine monitoring`, `B · Sleep and fatigue`, and `C · Resting heart-rate change` each contain 21 deterministic synthetic dates ending at the analysis date. Each has a separate scenario profile UUID. C can simulate an additional explicit urgent report. Selection changes the shared **analysis view only**; saved check-ins, history, and dashboard measurement cards are preserved. Refresh returns to saved records. No scenario is uploaded or copied into authenticated storage.

Mission name, scenario day 42, ISS habitat, crew ID, nominal communication link and monitoring priorities are explicitly fictional/simulated. They do not alter comparison rules or imply access to spacecraft telemetry.

## Research grounding

Source content and URLs were checked on 14 November 2026. The structured reference module is `src/lib/insights/references.ts`. NASA facts are general educational context; they do **not** validate our thresholds, monitoring categories or software.

- [NASA HRP hazards](https://www.nasa.gov/hrp/hazards/): radiation, isolation/confinement, gravity changes and other mission hazards.
- [NASA HRP risks](https://www.nasa.gov/hrp/risks/): cardiovascular adaptations, behavioral health and reduced cardiorespiratory/musculoskeletal fitness.
- [NASA sleep and irregular schedules](https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/): research context for sleep and workload observations.
- [Ongoing HRP research](https://www.nasa.gov/hrp/ongoing-hrp-research/): Standard Measures research and consistent health information.

SpO₂ and temperature references explain research context only; they do not establish diagnostic thresholds. No radiation exposure, bone density, clinical psychiatric condition or causal spaceflight effect can be inferred from these manual entries.
