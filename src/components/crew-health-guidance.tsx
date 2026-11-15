import { BookOpen, ShieldCheck } from "lucide-react";

// Static education only: no records, thresholds, assessment, storage or contact API.
const considerations = [
  {
    id: "rest",
    title: "Sleep and regular rest routines",
    context:
      "NASA studies how disrupted sleep, light-dark cycles and workload affect crew health and performance.",
    review:
      "Recorded sleep, fatigue and disruptions to your planned rest schedule. Hours alone do not measure sleep quality.",
    next: "Review your mission-approved work/rest routine with your team; do not adopt a universal sleep target from this app.",
    discuss:
      "Discuss persistent sleep difficulties, fatigue or trouble carrying out routine duties with qualified crew medical personnel.",
    sources: [
      {
        title: "NASA · Inadequate Sleep and Irregular Schedules",
        url: "https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/",
      },
    ],
  },
  {
    id: "activity",
    title: "Mission-prescribed physical activity",
    context:
      "NASA researches exercise countermeasures for losses in muscle, bone and cardiorespiratory fitness during spaceflight.",
    review:
      "Your assigned activity plan, recorded activity and any difficulty completing the planned tasks. Minutes do not measure fitness.",
    next: "Use the exercise countermeasures prescribed for your mission. Ask your team about changes rather than increasing intensity based on a chart.",
    discuss:
      "Discuss discomfort, persistent fatigue or difficulty following your assigned plan with crew medical support.",
    sources: [
      {
        title: "NASA · Reduced Cardiorespiratory and Musculoskeletal Fitness",
        url: "https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/",
      },
    ],
  },
  {
    id: "food-fluid",
    title: "Hydration and nutrition monitoring",
    context:
      "NASA identifies adequate water provision and nutrition as important for crew health and performance.",
    review:
      "Mission food/fluid logs, if used, and difficulties following your assigned plan. An optional water entry is not a nutrition assessment.",
    next: "Follow your mission-provided food and fluid plan; review concerns with your team instead of using a universal intake prescription.",
    discuss:
      "Discuss persistent difficulties with eating, drinking or following the plan with crew medical personnel and the mission nutrition team.",
    sources: [
      {
        title: "NASA · Water Quantity, section 6.3.2",
        url: "https://www.nasa.gov/reference/6-0-natural-and-induced-environments-vol-2/",
      },
      {
        title: "NASA · Inadequate Food and Nutrition",
        url: "https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/",
      },
    ],
  },
  {
    id: "wellbeing",
    title: "Well-being, isolation and communication",
    context:
      "NASA studies isolation and confinement; space-station crews can communicate with family and medical professionals for support.",
    review:
      "Your reported mood, fatigue and communication difficulties. These entries are not a mental-health screening result.",
    next: "Review the communication and psychological-support options provided by your mission, including any scheduled private support opportunities.",
    discuss:
      "Discuss persistent distress or changes affecting daily activities with qualified crew medical or behavioral-health support.",
    sources: [
      {
        title: "NASA · Behavioral Changes and Psychiatric Disorders",
        url: "https://www.nasa.gov/reference/risk-of-behavioral-changes-and-psychiatric-disorders/",
      },
    ],
  },
  {
    id: "monitoring",
    title: "Consistent monitoring and record keeping",
    context:
      "NASA Standard Measures research collects consistent measurements across body systems and mission time points.",
    review:
      "Dates, units, measurement conditions and missing entries. MissionPulse is not the NASA Standard Measures protocol.",
    next: "Check recording dates and units, describe relevant conditions, and leave unmeasured optional fields blank rather than inventing values.",
    discuss:
      "Ask crew medical support about concerning repeated observations, unclear measurement methods or uncertain readings.",
    sources: [
      {
        title: "NASA · Standard Measures",
        url: "https://www.nasa.gov/reference/standard-measures/",
      },
    ],
  },
];

function ResearchLink({ title, url }: { title: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer">
      {title}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function CrewHealthGuidance() {
  return (
    <div className="crew-health-guidance">
      <section
        className="panel crew-medical-guidance"
        id="crew-medical-guidance"
        aria-labelledby="crew-medical-title"
      >
        <h3 id="crew-medical-title">
          <ShieldCheck size={20} aria-hidden="true" />
          When Should I Ask for Medical Support?
        </h3>
        <p>
          Recorded observations are not diagnoses. A personal baseline change
          alone does not establish a medical emergency.
        </p>
        <p className="indicator-emergency">
          <strong>Reported an urgent symptom?</strong> Follow your established
          mission medical procedures or contact qualified medical support. This
          prototype does not provide emergency assessment, monitor an urgent
          report for resolution, or dispatch a response.
        </p>
        <p>
          Communicate self-reported urgent concerns promptly through your
          established crew medical channels. Do not wait for an app comparison.
        </p>
        <details className="crew-support-details">
          <summary>Consult crew medical support · when and how</summary>
          <p>
            <strong>General educational review suggestions:</strong> Persistent
            or concerning changes, symptoms, uncertainty about a measurement, or
            difficulties performing routine duties may warrant review with
            qualified crew medical personnel or a flight surgeon. These examples
            are not an exhaustive checklist or a triage rule.
          </p>
          <p>
            Use the contacts and procedures supplied by your mission. This
            information does not place a call, send a message or arrange a
            consultation. MissionPulse cannot monitor you or determine whether
            an emergency exists.
          </p>
          <p>
            This educational panel adds no automatic clinical thresholds or
            medical risk classification. Existing statistical labels are
            descriptive prototype observations, not clinical triage. No NASA
            approval of this panel or official flight medical protocol is
            implied.
          </p>
          <p>
            <strong>Source-supported context:</strong> NASA assigns medical care
            to flight medicine teams; CSA describes crew medical officers and
            flight-surgeon support. These sources explain professional roles,
            not a MissionPulse decision algorithm.
          </p>
          <div className="crew-source-links">
            <ResearchLink
              title="NASA · Health and Medical Care"
              url="https://www.nasa.gov/reference/3-0-health-and-medical-care/"
            />
            <ResearchLink
              title="CSA · Medical support"
              url="https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/medical-support.asp"
            />
          </div>
        </details>
        <div className="crew-guidance-actions">
          <a href="#measurement-topics">Review measurement basics</a>
          <a href="#crew-prevention">Explore preventive considerations</a>
        </div>
      </section>
      <details className="panel crew-prevention" id="crew-prevention">
        <summary>
          <BookOpen size={20} aria-hidden="true" />
          Supporting Your Health in Space
        </summary>
        <p>
          NASA research context is labeled below. Review prompts, next steps and
          discussion cues are general educational suggestions—not validated
          clinical rules or an individual care plan. Your mission’s approved
          procedures and qualified medical team take precedence.
        </p>
        <div className="crew-considerations">
          {considerations.map((item) => (
            <details
              className="crew-consideration"
              key={item.id}
              data-consideration={item.id}
            >
              <summary>{item.title}</summary>
              <dl>
                <div>
                  <dt>Why it matters · NASA context</dt>
                  <dd>{item.context}</dd>
                </div>
                <div>
                  <dt>What to monitor or review · general prompt</dt>
                  <dd>{item.review}</dd>
                </div>
                <div>
                  <dt>Safe next step · general suggestion</dt>
                  <dd>{item.next}</dd>
                </div>
                <div>
                  <dt>When to discuss concerns · general suggestion</dt>
                  <dd>{item.discuss}</dd>
                </div>
              </dl>
              <div className="crew-source-links">
                {item.sources.map((source) => (
                  <ResearchLink key={source.url} {...source} />
                ))}
              </div>
            </details>
          ))}
        </div>
        <p>
          No exercise targets, fluid or nutrition prescriptions, medications,
          radiation countermeasures or treatment plans are supplied here. The
          app has no contact, telemetry or emergency-response integration.
        </p>
      </details>
    </div>
  );
}
