export const hazardCategories = [
  "Space radiation",
  "Isolation and confinement",
  "Distance from Earth",
  "Altered gravity",
  "Hostile and closed environments",
] as const;
export type HazardCategory = (typeof hazardCategories)[number];
export type KnowledgeEntry = {
  id: string;
  topic: string;
  title: string;
  summary: string;
  whyItMatters: string;
  indicators: string[];
  monitoring: string;
  organization: "NASA Human Research Program" | "Canadian Space Agency";
  sourceTitle: string;
  sourceUrl: string;
  hazards: HazardCategory[];
  keywords: string[];
  limitations: string;
  lastVerified: string;
  version: string;
};
type EntryInput = Omit<
  KnowledgeEntry,
  "organization" | "lastVerified" | "version"
> & { organization?: KnowledgeEntry["organization"] };
const entry = (value: EntryInput): KnowledgeEntry => ({
  ...value,
  organization: value.organization ?? "NASA Human Research Program",
  lastVerified: "2026-11-14",
  version: "1.0.0",
});
const hazardsUrl = "https://www.nasa.gov/hrp/hazards/";
export const knowledgeEntries: KnowledgeEntry[] = [
  entry({
    id: "radiation",
    topic: "Radiation",
    title: "Space radiation",
    summary:
      "NASA identifies space radiation as a major hazard of human spaceflight.",
    whyItMatters:
      "Exposure monitoring is a distinct mission concern; routine wellness records are not dosimetry.",
    indicators: ["No radiation-dose sensor in MissionPulse"],
    monitoring:
      "Record relevant context for the designated crew medical team; use mission-approved radiation monitoring systems for exposure information.",
    sourceTitle: "5 Hazards of Human Spaceflight",
    sourceUrl: hazardsUrl,
    hazards: ["Space radiation"],
    keywords: ["radiation", "dose", "exposure", "cosmic", "solar"],
    limitations:
      "Heart rate, temperature and symptoms cannot establish radiation dose or radiation injury.",
  }),
  entry({
    id: "isolation",
    topic: "Behavior and sleep",
    title: "Isolation and confinement",
    summary:
      "NASA studies behavioral responses to prolonged isolation and confinement in small living spaces.",
    whyItMatters:
      "Mood and sleep entries can provide discussion context without establishing a psychological cause.",
    indicators: ["Mood", "Sleep", "Fatigue"],
    monitoring:
      "Record changes in routine and self-reported well-being; follow the crew’s established support procedures for concerns.",
    sourceTitle: "5 Hazards of Human Spaceflight",
    sourceUrl: hazardsUrl,
    hazards: ["Isolation and confinement"],
    keywords: ["isolation", "confined", "confinement", "lonely", "team"],
    limitations:
      "Self-reports do not measure isolation exposure or diagnose a mental-health condition.",
  }),
  entry({
    id: "distance",
    topic: "Mission environment",
    title: "Distance from Earth",
    summary:
      "NASA notes that access to supplies, instructions and medical care becomes more challenging farther from Earth.",
    whyItMatters:
      "Communication conditions are useful context for a mission’s established procedures.",
    indicators: ["Simulated communication status only"],
    monitoring:
      "Use designated crew medical contacts and established mission procedures. MissionPulse cannot replace them if communication is unavailable.",
    sourceTitle: "5 Hazards of Human Spaceflight",
    sourceUrl: hazardsUrl,
    hazards: ["Distance from Earth"],
    keywords: [
      "distance",
      "communication",
      "delay",
      "earth",
      "remote",
      "offline",
    ],
    limitations:
      "No real communications telemetry or approved emergency protocol is connected.",
  }),
  entry({
    id: "gravity",
    topic: "Gravity and fitness",
    title: "Altered gravity",
    summary:
      "Muscles, bones and other body systems adjust to the gravity environments encountered during spaceflight.",
    whyItMatters:
      "Activity and wellness logs give context; they do not prove adaptation or its cause.",
    indicators: ["Exercise duration", "Fatigue", "Resting heart rate"],
    monitoring:
      "Record activity duration, conditions and symptoms consistently for mission medical review.",
    sourceTitle: "5 Hazards of Human Spaceflight",
    sourceUrl: hazardsUrl,
    hazards: ["Altered gravity"],
    keywords: ["gravity", "microgravity", "weightlessness", "adaptation"],
    limitations:
      "The app has no gravity sensor and cannot determine a spaceflight cause from a baseline change.",
  }),
  entry({
    id: "closed-environment",
    topic: "Mission environment",
    title: "Hostile and closed environments",
    summary:
      "NASA identifies temperature, pressure, lighting, noise and microbes as important spacecraft habitability factors.",
    whyItMatters:
      "Environmental context can be recorded separately from personal measurements.",
    indicators: ["Sleep", "Temperature", "Self-reported symptoms"],
    monitoring:
      "Record relevant conditions if known; use the habitat’s approved environmental systems and procedures.",
    sourceTitle: "5 Hazards of Human Spaceflight",
    sourceUrl: hazardsUrl,
    hazards: ["Hostile and closed environments"],
    keywords: [
      "habitat",
      "environment",
      "closed",
      "hostile",
      "noise",
      "lighting",
      "pressure",
    ],
    limitations:
      "Body temperature does not measure cabin temperature, oxygen concentration or environmental safety.",
  }),
  entry({
    id: "cardiovascular",
    topic: "Body systems",
    title: "Cardiovascular adaptations",
    summary:
      "NASA researches how weightlessness changes blood circulation and the function of the heart and blood vessels.",
    whyItMatters:
      "Resting heart rate and blood pressure can be logged for comparison under consistent conditions.",
    indicators: [
      "Resting heart rate",
      "Systolic pressure",
      "Diastolic pressure",
    ],
    monitoring:
      "Verify units and recording conditions, and share persistent changes or symptoms through the crew’s medical review procedure.",
    sourceTitle: "Risk of Cardiovascular Adaptations",
    sourceUrl:
      "https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/",
    hazards: ["Altered gravity"],
    keywords: [
      "cardiovascular",
      "heart",
      "pulse",
      "blood",
      "pressure",
      "circulation",
      "bpm",
    ],
    limitations:
      "A comparison with a personal median is not a cardiovascular diagnosis, reference-range assessment or NASA clinical threshold.",
  }),
  entry({
    id: "sleep",
    topic: "Behavior and sleep",
    title: "Sleep disruption and irregular schedules",
    summary:
      "NASA studies how irregular schedules, light-dark cycles and workload affect sleep and crew performance.",
    whyItMatters:
      "Duration is one part of sleep context; changes can be discussed alongside workload and fatigue.",
    indicators: ["Sleep duration", "Fatigue", "Mood"],
    monitoring:
      "Record the selected mission date, sleep duration and relevant context. Do not infer sleep quality from duration alone.",
    sourceTitle: "Risk from Inadequate Sleep and Irregular Schedules",
    sourceUrl:
      "https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/",
    hazards: ["Isolation and confinement", "Hostile and closed environments"],
    keywords: [
      "sleep",
      "sleeping",
      "hours",
      "circadian",
      "schedule",
      "fatigue",
      "tired",
      "rest",
    ],
    limitations:
      "Duration alone cannot quantify circadian alignment, sleep quality, alertness or fitness for duty.",
  }),
  entry({
    id: "behavioral",
    topic: "Behavior and sleep",
    title: "Behavioral health",
    summary:
      "NASA studies psychological effects associated with spaceflight stressors, including isolation and distance from Earth.",
    whyItMatters:
      "Mood and fatigue logs are personal descriptions that can support communication with a qualified care team.",
    indicators: ["Mood", "Fatigue", "Sleep"],
    monitoring:
      "Record self-reported changes and context without assigning a diagnosis; use established crew support procedures.",
    sourceTitle: "Risk of Behavioral Changes and Psychiatric Disorders",
    sourceUrl:
      "https://www.nasa.gov/reference/risk-of-behavioral-changes-and-psychiatric-disorders/",
    hazards: ["Isolation and confinement", "Distance from Earth"],
    keywords: [
      "behavior",
      "behaviour",
      "mood",
      "stress",
      "stressed",
      "mental",
      "psychological",
    ],
    limitations:
      "Mood options in MissionPulse are not a validated mental-health screening instrument.",
  }),
  entry({
    id: "bone-muscle",
    topic: "Gravity and fitness",
    title: "Bone and muscle changes",
    summary:
      "NASA studies spaceflight-related bone changes and the effects of reduced loading in microgravity.",
    whyItMatters:
      "A daily activity log provides context but does not measure bone structure or muscle strength.",
    indicators: ["Exercise duration", "Fatigue", "Muscle discomfort"],
    monitoring:
      "Log activity and symptoms for review; exercise protocols and examinations belong to the mission’s qualified team.",
    sourceTitle: "Risk of Spaceflight-Induced Bone Changes",
    sourceUrl:
      "https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/",
    hazards: ["Altered gravity"],
    keywords: [
      "bones",
      "bone",
      "muscles",
      "muscle",
      "density",
      "strength",
      "microgravity",
    ],
    limitations:
      "This software cannot measure bone density, muscle mass, fractures or exercise suitability.",
  }),
  entry({
    id: "immune",
    topic: "Body systems",
    title: "Immune-system changes",
    summary:
      "NASA researches how spaceflight stressors can alter immune responses, including changes involving dormant viruses.",
    whyItMatters:
      "Research involves measurements beyond the routine values entered in this app.",
    indicators: ["Temperature", "Symptom context"],
    monitoring:
      "Record symptoms and context for medical review; routine readings cannot substitute for approved testing.",
    sourceTitle: "Risk of Altered Immune System Responses",
    sourceUrl:
      "https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/",
    hazards: [
      "Hostile and closed environments",
      "Space radiation",
      "Altered gravity",
    ],
    keywords: [
      "immune",
      "immunity",
      "infection",
      "virus",
      "viruses",
      "allergy",
    ],
    limitations:
      "Temperature or symptoms alone cannot diagnose infection or quantify immune function.",
  }),
  entry({
    id: "sans",
    topic: "Body systems",
    title: "Spaceflight-associated neuro-ocular syndrome",
    summary:
      "NASA studies spaceflight-related changes involving the eyes and brain under the SANS research topic.",
    whyItMatters:
      "Eye-related concerns require information that routine wellness logs do not capture.",
    indicators: ["Notes about symptoms; no ocular instrument"],
    monitoring:
      "Use the crew’s medical review procedures for visual concerns; no eye examination is performed here.",
    sourceTitle: "Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS)",
    sourceUrl:
      "https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/",
    hazards: ["Altered gravity"],
    keywords: ["sans", "eyes", "eye", "vision", "visual", "ocular", "neuro"],
    limitations:
      "The app cannot detect SANS, measure eye structure or interpret a visual symptom as a diagnosis.",
  }),
  entry({
    id: "nutrition",
    topic: "Gravity and fitness",
    title: "Nutrition in space",
    summary:
      "NASA studies adequate food and nutrition as part of crew health and performance during longer missions.",
    whyItMatters:
      "Meal context is different from measuring nutritional status.",
    indicators: ["Optional water intake", "Notes about routine"],
    monitoring:
      "Record relevant routine context and follow mission-approved nutrition guidance from the qualified team.",
    sourceTitle: "Risk of Inadequate Food and Nutrition",
    sourceUrl:
      "https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/",
    hazards: ["Distance from Earth", "Hostile and closed environments"],
    keywords: ["nutrition", "food", "diet", "water", "hydration", "meal"],
    limitations:
      "No nutritional assessment, diet prescription or fluid target is generated.",
  }),
  entry({
    id: "exercise",
    topic: "Gravity and fitness",
    title: "Exercise and reduced fitness",
    summary:
      "NASA researches exercise approaches to counter spaceflight-related reductions in musculoskeletal and cardiorespiratory fitness.",
    whyItMatters:
      "Exercise duration can be logged without assuming it measures fitness or workload.",
    indicators: ["Exercise duration", "Fatigue", "Resting heart rate"],
    monitoring:
      "Verify duration and context; approved exercise plans and changes require the designated mission team.",
    sourceTitle:
      "Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness",
    sourceUrl:
      "https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/",
    hazards: ["Altered gravity"],
    keywords: [
      "exercise",
      "fitness",
      "workout",
      "activity",
      "training",
      "muscle",
      "strength",
    ],
    limitations:
      "Minutes alone do not measure exercise intensity, physical capacity or operational readiness.",
  }),
  entry({
    id: "radiation-monitoring",
    topic: "Radiation",
    title: "Radiation exposure monitoring",
    summary:
      "The Canadian Space Agency describes CANS as an instrument under development for measuring neutron radiation exposure in space.",
    whyItMatters:
      "Specialized instruments address exposure information that routine vital signs cannot provide.",
    indicators: ["No dosimetry or CANS data connected"],
    monitoring:
      "Treat radiation monitoring as a separate mission system; no radiation exposure is inferred from check-ins.",
    organization: "Canadian Space Agency",
    sourceTitle: "Monitoring radiation for astronaut health",
    sourceUrl:
      "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp",
    hazards: ["Space radiation"],
    keywords: [
      "radiation",
      "monitoring",
      "cans",
      "neutron",
      "detector",
      "dosimeter",
      "canada",
      "csa",
    ],
    limitations:
      "MissionPulse has no connection to CANS and cannot estimate dose, diagnose radiation injury or define exposure limits.",
  }),
  entry({
    id: "space-research",
    topic: "Research methods",
    title: "Why study health in space?",
    summary:
      "CSA describes space-station research as a way to prepare for deep-space destinations and improve knowledge useful on Earth.",
    whyItMatters:
      "Research context helps explain why spaceflight health is studied across many body systems.",
    indicators: ["Recorded health context; no experiment telemetry"],
    monitoring:
      "Keep the distinction between educational research and a clinical protocol clear when using this demonstration.",
    organization: "Canadian Space Agency",
    sourceTitle: "Why do we conduct science experiments in space?",
    sourceUrl:
      "https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp",
    hazards: ["Altered gravity", "Distance from Earth"],
    keywords: ["research", "experiments", "science", "canada", "csa", "earth"],
    limitations:
      "A curated educational summary is not an experimental result or evidence validating MissionPulse.",
  }),
  entry({
    id: "standard-measures",
    topic: "Research methods",
    title: "Consistent research measurements",
    summary:
      "NASA's ongoing HRP research includes Standard Measures, which collects physiological and psychological information across missions.",
    whyItMatters:
      "Consistent records can help organize observations without making them medically validated.",
    indicators: ["Vital signs", "Wellness context", "Submission dates"],
    monitoring:
      "Record units, timestamps and sources consistently. Missing values should remain missing.",
    sourceTitle: "Ongoing HRP Research — Standard Measures",
    sourceUrl: "https://www.nasa.gov/hrp/ongoing-hrp-research/",
    hazards: ["Altered gravity", "Hostile and closed environments"],
    keywords: [
      "measurements",
      "records",
      "missing",
      "data",
      "research",
      "standard",
      "temperature",
      "oxygen",
      "spo2",
    ],
    limitations:
      "The app does not implement NASA’s Standard Measures research protocol or automatic device collection.",
  }),
  entry({
    id: "vestibular",
    topic: "Body systems",
    title: "Gravity changes and dizziness",
    summary:
      "NASA studies how altered gravity can affect orientation and sensorimotor or vestibular function.",
    whyItMatters:
      "Symptom timing and context can be useful to record for a qualified reviewer.",
    indicators: ["Dizziness", "Nausea", "Symptom context"],
    monitoring:
      "If not an emergency, record when the symptom began, its context and associated symptoms for the crew medical team. For an urgent concern, use the established emergency procedure immediately.",
    sourceTitle: "Risk of Altered Sensorimotor and Vestibular Function",
    sourceUrl:
      "https://www.nasa.gov/reference/risk-of-altered-sensorimotor-and-vestibular-function/",
    hazards: ["Altered gravity"],
    keywords: [
      "dizzy",
      "dizziness",
      "vestibular",
      "balance",
      "nausea",
      "orientation",
      "motion",
    ],
    limitations:
      "A dizziness report cannot establish a cause. This page does not assess severity or replace medical evaluation.",
  }),
];
export const knowledgeTopics = [
  ...new Set(knowledgeEntries.map((item) => item.topic)),
];
export function getKnowledgeEntry(id: string) {
  return knowledgeEntries.find((item) => item.id === id);
}
