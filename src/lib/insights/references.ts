// Educational context verified against NASA pages on 14 November 2026.
// These publications DO NOT validate MissionPulse's statistical comparison rules.
export type ScientificReference = {
  id: string;
  topic: string;
  explanation: string;
  measurements: string[];
  organization: string;
  title: string;
  url: string;
  limitations: string;
  verifiedOn: string;
};
export const scientificReferences: ScientificReference[] = [
  {
    id: "isolation",
    topic: "Isolation and confinement",
    explanation:
      "NASA studies behavioral responses to prolonged isolation and confinement during missions.",
    measurements: ["Mood", "Sleep", "Fatigue"],
    organization: "NASA Human Research Program",
    title: "5 Hazards of Human Spaceflight",
    url: "https://www.nasa.gov/hrp/hazards/",
    limitations:
      "Self-reports do not quantify isolation exposure or establish psychological effects.",
    verifiedOn: "2026-11-14",
  },
  {
    id: "gravity",
    topic: "Altered gravity",
    explanation:
      "Muscles, bones and other body systems adjust to the different gravity environments encountered in spaceflight.",
    measurements: ["Exercise", "Fatigue"],
    organization: "NASA Human Research Program",
    title: "5 Hazards of Human Spaceflight",
    url: "https://www.nasa.gov/hrp/hazards/",
    limitations:
      "This app has no gravity telemetry and cannot identify adaptation from a few readings.",
    verifiedOn: "2026-11-14",
  },
  {
    id: "cardiovascular",
    topic: "Cardiovascular adaptations",
    explanation:
      "NASA describes changes to blood circulation and cardiovascular function in weightlessness as an area of ongoing research.",
    measurements: ["Resting heart rate", "Blood pressure"],
    organization: "NASA Human Research Program",
    title: "Risks of Human Spaceflight — Cardiovascular Adaptations",
    url: "https://www.nasa.gov/hrp/risks/",
    limitations:
      "A baseline deviation cannot establish cardiovascular disease or a spaceflight cause. Our change rules are not NASA thresholds.",
    verifiedOn: "2026-11-14",
  },
  {
    id: "sleep",
    topic: "Sleep and irregular schedules",
    explanation:
      "NASA researches how irregular schedules, light-dark cycles and workload affect sleep and performance during spaceflight.",
    measurements: ["Sleep duration", "Fatigue", "Mood"],
    organization: "NASA Human Research Program",
    title: "Risk from Inadequate Sleep and Irregular Schedules",
    url: "https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/",
    limitations:
      "Sleep duration alone does not measure sleep quality, circadian alignment or performance.",
    verifiedOn: "2026-11-14",
  },
  {
    id: "behavioral",
    topic: "Behavioral health",
    explanation:
      "NASA studies psychological effects associated with spaceflight stressors, including isolation and distance from Earth.",
    measurements: ["Mood", "Fatigue", "Sleep"],
    organization: "NASA Human Research Program",
    title: "Risks of Human Spaceflight — Behavioral Changes",
    url: "https://www.nasa.gov/hrp/risks/",
    limitations:
      "Mood categories are personal descriptions, not a validated mental-health screening instrument.",
    verifiedOn: "2026-11-14",
  },
  {
    id: "fitness",
    topic: "Cardiorespiratory and musculoskeletal fitness",
    explanation:
      "NASA researches exercise approaches to counter losses in bone, muscle and cardiovascular performance during spaceflight.",
    measurements: ["Exercise duration", "Fatigue"],
    organization: "NASA Human Research Program",
    title: "Risks of Human Spaceflight — Reduced Fitness",
    url: "https://www.nasa.gov/hrp/risks/",
    limitations:
      "Minutes of exercise do not quantify workload, bone density, muscle strength or fitness.",
    verifiedOn: "2026-11-14",
  },
  {
    id: "radiation",
    topic: "Space radiation",
    explanation:
      "NASA identifies space radiation as one of the five principal hazards of human spaceflight.",
    measurements: ["No direct measurement in MissionPulse"],
    organization: "NASA Human Research Program",
    title: "5 Hazards of Human Spaceflight",
    url: "https://www.nasa.gov/hrp/hazards/",
    limitations:
      "No dosimetry is available. These vital signs cannot estimate radiation dose or radiation injury.",
    verifiedOn: "2026-11-14",
  },
  {
    id: "research",
    topic: "Consistent health records",
    explanation:
      "NASA's Standard Measures research collects physiological and psychological information to study human adaptation to spaceflight.",
    measurements: ["Recorded vital signs", "Wellness context"],
    organization: "NASA Human Research Program",
    title: "Ongoing HRP Research — Standard Measures",
    url: "https://www.nasa.gov/hrp/ongoing-hrp-research/",
    limitations:
      "This manual-entry prototype is not the NASA Standard Measures protocol, device collection system or a validated substitute.",
    verifiedOn: "2026-11-14",
  },
];
export function findReference(id: string) {
  return scientificReferences.find((reference) => reference.id === id);
}
