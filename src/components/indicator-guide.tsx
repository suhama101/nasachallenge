import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Droplets,
  Heart,
  Moon,
  Thermometer,
  Waves,
} from "lucide-react";
import { CrewHealthGuidance } from "./crew-health-guidance";

// Static educational presentation only: no record values, thresholds or analysis.
const sources = {
  hazards: {
    title: "NASA · Five Hazards of Human Spaceflight",
    url: "https://www.nasa.gov/hrp/hazards/",
  },
  risks: {
    title: "NASA · Risks of Human Spaceflight",
    url: "https://www.nasa.gov/hrp/risks/",
  },
  research: {
    title: "NASA · Ongoing HRP Research",
    url: "https://www.nasa.gov/hrp/ongoing-hrp-research/",
  },
  cardiovascular: {
    title: "NASA · Cardiovascular Adaptations",
    url: "https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/",
  },
  sleep: {
    title: "NASA · Sleep and Irregular Schedules",
    url: "https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/",
  },
  measures: {
    title: "NASA · Standard Measures",
    url: "https://www.nasa.gov/reference/standard-measures/",
  },
  oxygen: {
    title: "NASA · Risk of Hypoxia",
    url: "https://www.nasa.gov/reference/risk-of-hypoxia/",
  },
  radiation: {
    title: "CSA · Monitoring Radiation for Astronaut Health",
    url: "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp",
  },
  experiments: {
    title: "CSA · Why Conduct Science Experiments in Space?",
    url: "https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp",
  },
  vitalBasics: {
    title: "General measurement background · MedlinePlus Vital Signs",
    url: "https://medlineplus.gov/ency/article/002341.htm",
  },
  glucoseBasics: {
    title: "General measurement background · MedlinePlus Blood Glucose Test",
    url: "https://medlineplus.gov/lab-tests/blood-glucose-test/",
  },
  oxygenBasics: {
    title: "General measurement background · MedlinePlus Pulse Oximetry",
    url: "https://medlineplus.gov/lab-tests/pulse-oximetry/",
  },
};

const lessons = [
  {
    id: "heart-rate",
    title: "Heart rate",
    icon: Heart,
    what: "Your heartbeat rate, recorded in beats per minute (bpm).",
    why: "A consistent resting reading gives medical support useful context about your circulation. A number alone does not explain its cause.",
    how: "Enter an existing resting pulse reading from the measurement process chosen by your medical team. This app receives no live sensor data.",
    space:
      "Altered gravity: NASA studies how weightlessness changes the heart and blood vessels. A pulse reading cannot establish a spaceflight effect.",
    next: "Check the date and units, and note rest, recent activity or other measurement context. Share repeated changes or concerns with qualified support.",
    source: "cardiovascular",
    basics: "vitalBasics",
  },
  {
    id: "blood-pressure",
    title: "Blood pressure",
    icon: Activity,
    what: "A pair of pressure readings in mmHg, entered as the top (systolic) and bottom (diastolic) values from your measurement.",
    why: "Keeping both readings together helps a qualified reviewer interpret a cardiovascular observation in context.",
    how: "Copy the two existing readings from the equipment and method selected by your medical team. The app does not operate a cuff or choose a spaceflight procedure.",
    space:
      "Altered gravity: NASA's cardiovascular research includes changes affecting blood pressure. That research does not turn a personal comparison into a diagnosis.",
    next: "Check that the top and bottom values and units were copied correctly. Note measurement conditions; discuss persistent changes with qualified support.",
    source: "cardiovascular",
    basics: "vitalBasics",
  },
  {
    id: "blood-glucose",
    title: "Blood glucose",
    icon: Droplets,
    what: "The amount of glucose (sugar) in blood. This optional field uses mg/dL.",
    why: "An existing result can add context when a qualified professional has requested glucose monitoring. This app does not decide whether you need a test.",
    how: "Enter a result already obtained through an appropriate medical process. Leave it blank if it was not measured; do not enter zero for missing data.",
    space:
      "NASA Standard Measures studies multiple body systems and nutrition-related samples. This is broad research context; it does not establish a glucose-specific spaceflight rule for this app.",
    next: "Keep the original units and relevant meal/testing context. Ask qualified medical support to interpret a result; the selected NASA sources provide no personal glucose cutoff.",
    source: "measures",
    basics: "glucoseBasics",
  },
  {
    id: "temperature",
    title: "Body temperature",
    icon: Thermometer,
    what: "A recorded body-temperature measurement in degrees Celsius (°C), not the temperature of the cabin.",
    why: "It provides a physical observation to review alongside symptoms and the measurement conditions.",
    how: "Enter an existing thermometer reading using your medical team's measurement instructions. The app does not measure temperature itself.",
    space:
      "Hostile/closed environments: NASA identifies cabin conditions and immune responses as research concerns. This general hazard context is not a fever threshold or proof of an illness.",
    next: "Record the method and relevant symptoms in your notes. Check the units and discuss persistent changes or concerns with qualified support.",
    source: "hazards",
    basics: "vitalBasics",
  },
  {
    id: "spo2",
    title: "SpO₂",
    icon: Waves,
    what: "An estimate of blood oxygen saturation, usually reported by a pulse oximeter as a percentage. Device readings have limitations.",
    why: "An existing oxygen reading may add context for qualified medical review. A standalone percentage cannot establish a diagnosis or whether you are safe.",
    how: "Enter an existing reading from the process selected by medical support. Leave an unmeasured value blank. Legacy zero values remain stored as Needs review and are excluded from calculations.",
    space:
      "Hostile/closed environments: NASA researches oxygen and pressure conditions for future missions and spacewalks. That research does not validate an individual SpO₂ alert rule in MissionPulse.",
    next: "Check that the value and device context were recorded correctly. Discuss concerns with qualified support; do not use the app to change oxygen supply, suit or cabin settings.",
    source: "oxygen",
    basics: "oxygenBasics",
  },
  {
    id: "sleep",
    title: "Sleep",
    icon: Moon,
    what: "The hours you report sleeping during your last sleep period, including fractional hours.",
    why: "A sleep log helps describe rest and routine over time. It is a self-report, not a sleep study or a diagnosis.",
    how: "Enter the duration of your sleep period. NASA research also uses sleep reports and activity sensors; this app accepts manual entries only.",
    space:
      "Isolation and mission schedules: NASA studies sleep loss, changing light-dark cycles and workload. Its sleep research describes scheduled relaxation and lighting approaches, not a personal treatment plan here.",
    next: "Note schedule changes and rest conditions. Review repeated entries together; use your established rest/work plan and discuss persistent difficulties with qualified support.",
    source: "sleep",
    basics: null,
  },
  {
    id: "mood",
    title: "Mood",
    icon: Heart,
    what: "Your own description of how you felt on the mission date. A mood label is not a mental-health assessment.",
    why: "A simple description gives context for a conversation about well-being without turning feelings into an invented medical score.",
    how: "Choose the word that best matches your experience and add optional context. There is no automatic emotional assessment.",
    space:
      "Isolation and confinement: NASA studies behavioral responses to living in small, isolated teams. A mood entry cannot identify the cause of a feeling.",
    next: "Look at your entries with their context, and use established crew support or qualified professionals for persistent concerns. The app cannot diagnose a mental-health condition.",
    source: "hazards",
    basics: null,
  },
  {
    id: "fatigue",
    title: "Fatigue",
    icon: Moon,
    what: "Your self-reported tiredness on the existing 0–10 scale, from no fatigue to most fatigued. It is not a validated clinical alert score.",
    why: "Recording how tired you feel gives context alongside sleep and workload; it does not establish performance fitness.",
    how: "Select the rating that reflects your experience. This manual report is not a cognitive test or sensor measurement.",
    space:
      "NASA studies sleep disruption and work overload as spaceflight stressors. A fatigue report alone cannot tell whether either is the cause.",
    next: "Note recent sleep and workload. Review persistent difficulties with qualified support and your established work/rest procedures; no personal safety cutoff is supplied here.",
    source: "sleep",
    basics: null,
  },
  {
    id: "exercise",
    title: "Exercise",
    icon: Activity,
    what: "The number of minutes of exercise you report for the selected mission date, not a measure of exercise quality or fitness.",
    why: "An activity log documents what happened and helps a reviewer understand your routine.",
    how: "Enter the duration of completed activity; enter zero if you recorded no exercise. The app does not monitor equipment or prescribe a session.",
    space:
      "Altered gravity: NASA researches reduced cardiorespiratory and musculoskeletal fitness. Its cardiovascular guidance identifies regular exercise as supporting fitness, without prescribing a personal routine here.",
    next: "Keep useful activity context and follow the exercise plan set by your qualified team. Review changes or difficulties with them rather than changing your plan based on an app label.",
    source: "cardiovascular",
    basics: null,
  },
  {
    id: "hydration",
    title: "Hydration",
    icon: Droplets,
    what: "The water intake you report in liters. Intake alone does not measure your body's hydration status.",
    why: "A reported amount adds context to a daily log; it cannot determine an individual's fluid needs.",
    how: "If tracked, enter water consumed for that mission date. Leave it blank if unknown; zero means you recorded none.",
    space:
      "NASA Standard Measures includes nutrition-related research samples. This supports broad research context, not an intake target or a hydration assessment from a water log.",
    next: "Note tracking limits and relevant activity. Follow your qualified team's guidance on fluids; the selected sources do not establish an individualized water target.",
    source: "measures",
    basics: null,
  },
  {
    id: "symptoms",
    title: "Reported symptoms",
    icon: Activity,
    what: "Descriptions of what you notice, such as dizziness or discomfort. Choosing a symptom does not determine its cause or severity.",
    why: "Your description and timing can support a conversation with a qualified professional; the prototype cannot perform an examination.",
    how: "Select applicable symptoms and add context in notes. Preserve the separate urgent-symptom self-report when requesting immediate assessment; notes are not automatically screened for emergencies.",
    space:
      "NASA lists multiple human-system risks and interacting spaceflight hazards. A symptom cannot identify a specific spaceflight cause; it also cannot measure radiation dose.",
    next: "Keep onset and context available for qualified support. For a user-reported urgent concern, use established mission medical procedures. Do not wait for this prototype to assess or respond.",
    source: "risks",
    basics: null,
  },
] as const;

function SourceLink({ source }: { source: keyof typeof sources }) {
  const item = sources[source];
  return (
    <a
      className="lesson-source"
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {item.title}
      <ArrowUpRight size={14} />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

export function IndicatorGuide() {
  return (
    <section
      className="indicator-guide"
      id="understand-your-health"
      aria-labelledby="indicator-guide-title"
    >
      <header>
        <div>
          <p className="eyebrow">A LITTLE CONTEXT GOES A LONG WAY</p>
          <h2 id="indicator-guide-title">Understand Your Health</h2>
        </div>
        <BookOpen size={27} strokeWidth={1.5} />
      </header>
      <p>
        Learn what a recorded value means, why it may matter, and what the
        research can—and cannot—tell you. Open any topic below. General
        recording guidance is separate from the labeled NASA facts; none of it
        is a flight medical protocol or an individualized treatment plan.
      </p>
      <CrewHealthGuidance />
      <div className="indicator-grid" id="measurement-topics">
        {lessons.map(
          ({
            id,
            title,
            icon: Icon,
            what,
            why,
            how,
            space,
            next,
            source,
            basics,
          }) => (
            <details className="indicator-lesson" id={`learn-${id}`} key={id}>
              <summary>
                <Icon size={18} />
                <strong>{title}</strong>
                <small>Learn what this means · what / why / how / next</small>
              </summary>
              <div className="lesson-body">
                <dl>
                  <div>
                    <dt>WHAT</dt>
                    <dd>{what}</dd>
                  </div>
                  <div>
                    <dt>WHY · GENERAL CONTEXT</dt>
                    <dd>{why}</dd>
                  </div>
                  <div>
                    <dt>HOW · RECORDING GUIDANCE</dt>
                    <dd>{how}</dd>
                  </div>
                  <div className="lesson-fact">
                    <dt>SPACE CONNECTION · NASA RESEARCH</dt>
                    <dd>{space}</dd>
                  </div>
                  <div>
                    <dt>WHAT NEXT · GENERAL GUIDANCE</dt>
                    <dd>{next}</dd>
                  </div>
                  <div className="lesson-help">
                    <dt>WHEN TO SEEK HELP</dt>
                    <dd>
                      The cited NASA research does not set a personal
                      consultation threshold for this entry. Share persistent
                      changes or concerns with qualified crew medical support or
                      a flight surgeon through your established procedures. This
                      prototype cannot assess urgency or provide emergency
                      response.
                    </dd>
                  </div>
                  <div>
                    <dt>NASA SOURCE</dt>
                    <dd>
                      <SourceLink source={source} />
                    </dd>
                  </div>
                </dl>
                {basics && <SourceLink source={basics} />}
                <p className="lesson-attribution">
                  The NASA source supports the space-research context above, not
                  MissionPulse’s input limits, statistical labels or personal
                  medical advice. Research links checked 15 November 2026.
                </p>
              </div>
            </details>
          ),
        )}
      </div>
      <details className="guide-research-map">
        <summary>
          Research behind this guide · NASA &amp; Canadian Space Agency
        </summary>
        <ol>
          <li>
            <SourceLink source="hazards" />
            The five broad hazards organize research; they do not diagnose the
            cause of a personal measurement.
          </li>
          <li>
            <SourceLink source="risks" />
            Specific human-system risks explain research priorities, not
            thresholds for this app.
          </li>
          <li>
            <SourceLink source="research" />
            The ongoing research directory links to Standard Measures and other
            investigations.
          </li>
          <li>
            <SourceLink source="radiation" />
            Radiation exposure monitoring uses specialized instruments. Heart
            rate, symptoms or SpO₂ do not measure radiation dose.
          </li>
          <li>
            <SourceLink source="experiments" />
            Space experiments help researchers learn about human health and
            prepare for exploration. They do not clinically validate this
            prototype.
          </li>
        </ol>
        <p>
          MissionPulse collects manual records, not device telemetry. Which
          examination is needed and how it should be performed are decisions for
          qualified medical support. No prescription, treatment, individual
          numeric cutoff or NASA emergency procedure is supplied here.
        </p>
      </details>
    </section>
  );
}
