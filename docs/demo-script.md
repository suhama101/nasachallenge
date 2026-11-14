# MissionPulse: a 2–3 minute demonstration

The guided entry point is `/demo`: use `http://localhost:3001/demo` for local review, or `https://missionpulse.vercel.app/demo` after verifying the approved Phase 5 deployment's exact commit. No account or API key is needed. Use your own browser's **fictional** demo records or a new isolated browser profile. Never clear an existing demonstration database to prepare this presentation.

| Time      | Action and suggested narration                                                                                                                                                                                                                                                                                                                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:20 | From Mission Overview, choose **Explore MissionPulse Demo**. “Spaceflight monitoring involves changes across multiple body systems. MissionPulse organizes daily records, makes comparisons explainable, and links to research. Alex Morgan and Asteria Expedition 07 are fictional; this is a prototype, not live telemetry or a medical device.”                                                                      |
| 0:20–0:55 | Choose **Start the saved-record journey**. Keep today's UTC mission date. Manually enter the fictional example below, save once, and show the confirmation's mission date and submission timestamp. “These are user-entered demonstration values. We never infer a missing measurement.”                                                                                                                                |
| 0:55–1:15 | Choose **View Health History**, open the new record, then refresh. Show that the same values remain. Open a chart's exact-value table. Navigate to **Mission Overview** and point to the updated latest measurement. “Records persist in this browser; they are not an authenticated or synchronized medical record.”                                                                                                          |
| 1:15–1:40 | Open **Health Insights**, using **Saved local demo records**. Show the new sleep value, earlier median, sample count and evidence. “The comparison excludes the current mission date. Changes are descriptive and these thresholds are unvalidated; a label does not establish health or safety.”                                                                                                                       |
| 1:40–2:05 | Open **AI Health Assistant**, select **Saved browser demo**, and opt into selected measurements **for this message**. Ask **How has my sleep changed over the last seven days?** Show today's recorded sleep value in the dated answer, then point out that consent resets. “This is the labeled local deterministic/curated response. No Groq call is being made. Exact values come from the selected records.”        |
| 2:05–2:35 | Return to Overview → **Explore MissionPulse Demo** → **Open scenario B**. Show the sleep chart and paired sleep/fatigue observation. “This is a separate synthetic profile. It changes the analysis preview and does not overwrite our saved entry.” Follow **Explore related NASA research** and open the official source link. “NASA research provides educational context, not validation of this software's rules.” |
| 2:35–2:50 | Briefly mention A (routine comparisons) and C (higher heart-rate entries against a personal baseline), then **Return to saved records**. “An urgent report takes priority over apparently routine measurements. The app directs concerns to designated crew medical officers and established mission procedures; it cannot prescribe or invent emergency treatment.”                                                    |

### Explicitly fictional input example

These values are presentation inputs, **not normal ranges, medical targets or treatment advice**. Enter them manually; do not import or replace an existing record.

| Form field                    | Example                                                   |
| ----------------------------- | --------------------------------------------------------- |
| Resting heart rate            | 84 bpm                                                    |
| Systolic / diastolic pressure | 124 / 82 mmHg                                             |
| Body temperature              | 36.7 °C                                                   |
| Oxygen saturation             | 98%                                                       |
| Sleep duration                | 4.8 hours                                                 |
| Exercise                      | 45 minutes                                                |
| Mood / fatigue                | Neutral / 6 of 10                                         |
| Optional glucose / water      | Leave blank; they remain not recorded                     |
| Notes                         | “Fictional judge demonstration; not medical information.” |

If today's date already has an entry, a deliberate new check-in gets a distinct ID. History preserves both; analysis uses the latest submitted valid entry per mission date. Do not claim the sample values are astronauts' real measurements.

### Practical presentation notes

- Keep the same browser, origin and tab when moving between modules. Client-side navigation preserves the selected analysis dataset; a full refresh deliberately returns to saved records. Saved measurements and conversations still persist.
- Daily Health Check and History always concern saved browser records. Scenarios alter only the analysis/assistant context. Selecting **Start the saved-record journey** or **View Health Insights** explicitly returns analysis to that saved dataset.
- To reproduce all scenarios without typing, open the demo guide's A/B/C links. Each has 21 synthetic dates, mission context, the relevant chart, deterministic observation and a related NASA topic. Starting a scenario does not save it.
- An empty browser repository is a supported state. Enter one fictional check-in and acknowledge insufficient baseline evidence rather than claiming an earlier comparison exists. Use a separate synthetic scenario to demonstrate a longer history.
- With Groq disabled, use the real local fallback. Do not describe it as verified live generative AI or imply NASA/CSA endorsement.

See [submission-readiness.md](submission-readiness.md) for the measured audit, evaluation set, scientific and privacy limits, and release boundary.
