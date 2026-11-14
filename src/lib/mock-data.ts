export const mission = {
  name: "Asteria Expedition 07",
  station: "International Space Station",
  crewId: "AST-0042",
  astronaut: "Alex Morgan",
  role: "Flight Engineer",
  initials: "AM",
  day: 42,
  duration: 180,
};
export type TrendPoint = {
  date: string;
  label: string;
  heartRate: number;
  sleep: number;
};
export const trends: TrendPoint[] = [
  { date: "2026-11-01", label: "Nov 01", heartRate: 67, sleep: 6.8 },
  { date: "2026-11-02", label: "Nov 02", heartRate: 66, sleep: 7.1 },
  { date: "2026-11-03", label: "Nov 03", heartRate: 68, sleep: 6.5 },
  { date: "2026-11-04", label: "Nov 04", heartRate: 65, sleep: 7.4 },
  { date: "2026-11-05", label: "Nov 05", heartRate: 66, sleep: 7.0 },
  { date: "2026-11-06", label: "Nov 06", heartRate: 64, sleep: 7.6 },
  { date: "2026-11-07", label: "Nov 07", heartRate: 65, sleep: 7.3 },
  { date: "2026-11-08", label: "Nov 08", heartRate: 66, sleep: 6.9 },
  { date: "2026-11-09", label: "Nov 09", heartRate: 64, sleep: 7.5 },
  { date: "2026-11-10", label: "Nov 10", heartRate: 65, sleep: 7.1 },
  { date: "2026-11-11", label: "Nov 11", heartRate: 63, sleep: 7.8 },
  { date: "2026-11-12", label: "Nov 12", heartRate: 65, sleep: 7.0 },
  { date: "2026-11-13", label: "Nov 13", heartRate: 64, sleep: 7.4 },
  { date: "2026-11-14", label: "Nov 14", heartRate: 64, sleep: 7.2 },
];
export type Observation = {
  title: string;
  detail: string;
  kind: "heart" | "sleep";
};
export const modules = [
  {
    slug: "daily-health-check",
    title: "Daily Health Check",
    eyebrow: "Your daily routine",
    description:
      "A focused place to record daily measurements and personal context.",
    planned: [
      "Guided measurement entry with explicit units",
      "Input validation and recording timestamps",
      "Review before saving to a future database",
    ],
  },
  {
    slug: "health-history",
    title: "Health History",
    eyebrow: "A longer perspective",
    description: "A clear record of measurements across the mission.",
    planned: [
      "Chronological measurement history",
      "Date and measurement filters",
      "Transparent data provenance",
    ],
  },
  {
    slug: "health-insights",
    title: "Health Insights",
    eyebrow: "Context for your data",
    description:
      "Explainable observations to support conversations with a qualified care team.",
    planned: [
      "Transparent trend comparisons",
      "Clear uncertainty and limitations",
      "Human review and monitoring context",
    ],
  },
  {
    slug: "space-health-knowledge",
    title: "Space Health Knowledge",
    eyebrow: "Understand the environment",
    description:
      "A future reference library about the human experience of spaceflight.",
    planned: [
      "Source-linked educational articles",
      "Sleep, movement and mission environment topics",
      "Accessible explanations with reviewed references",
    ],
  },
  {
    slug: "ai-health-assistant",
    title: "AI Health Assistant",
    eyebrow: "Thoughtful support, in development",
    description:
      "A future assistant for exploring educational information and understanding recorded data.",
    planned: [
      "Server-side Groq integration",
      "Source-aware answers with clear limitations",
      "No autonomous diagnosis or treatment decisions",
    ],
  },
  {
    slug: "crew-profile",
    title: "Crew Profile",
    eyebrow: "The person behind the mission",
    description: "A future home for crew preferences and mission details.",
    planned: [
      "Authenticated crew identity",
      "Mission and role information",
      "Privacy and account preferences",
    ],
  },
] as const;
