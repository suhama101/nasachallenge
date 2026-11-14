import { recordSchema, type HealthCheckIn } from "../health/validation";
import { shiftDate } from "../health/dates";
export const scenarioDefinitions = [
  {
    id: "routine",
    name: "A · Routine monitoring",
    indicator: "heartRate" as const,
    knowledgeTopic: "cardiovascular",
    context:
      "Review a fictional crew member’s consistent daily monitoring under comparable recording conditions.",
    description:
      "Twenty-one synthetic daily check-ins with limited baseline changes.",
    profileId: "10000000-0000-4000-8000-000000000001",
  },
  {
    id: "sleep-fatigue",
    name: "B · Sleep and fatigue",
    indicator: "sleep" as const,
    knowledgeTopic: "sleep",
    context:
      "Compare a fictional crew member’s recent sleep and fatigue entries with their earlier routine; workload and causes are not inferred.",
    description:
      "An established history followed by three days of decreasing sleep and increasing fatigue.",
    profileId: "10000000-0000-4000-8000-000000000002",
  },
  {
    id: "heart-rate",
    name: "C · Resting heart-rate change",
    indicator: "heartRate" as const,
    knowledgeTopic: "cardiovascular",
    context:
      "Inspect a fictional crew member’s three higher heart-rate entries against an earlier personal median, without assigning medical risk.",
    description:
      "An established history followed by three higher resting heart-rate entries.",
    profileId: "10000000-0000-4000-8000-000000000003",
  },
] as const;
export type ScenarioId = (typeof scenarioDefinitions)[number]["id"];
export function createScenarioDataset(
  id: ScenarioId,
  asOf: string,
  urgent = false,
): HealthCheckIn[] {
  const stamp = Date.parse(asOf);
  if (!Number.isFinite(stamp)) return [];
  const today = new Date(stamp).toISOString().slice(0, 10);
  const scenario = scenarioDefinitions.find((item) => item.id === id)!;
  return Array.from({ length: 21 }, (_, index) => {
    const missionDate = shiftDate(today, index - 20);
    const timestamp = new Date(
      Math.min(Date.parse(`${missionDate}T07:30:00Z`), stamp),
    ).toISOString();
    const recent = index - 18;
    return recordSchema.parse({
      id: `2000000${scenarioDefinitions.indexOf(scenario) + 1}-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      profileId: scenario.profileId,
      missionDate,
      recordedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
      source: "synthetic",
      heartRate:
        id === "heart-rate" && recent >= 0
          ? [90, 94, 98][recent]
          : 72 + [0, 1, -1][index % 3],
      sleep:
        id === "sleep-fatigue" && recent >= 0
          ? [7, 6.2, 5.3][recent]
          : [7.6, 7.7, 7.5][index % 3],
      fatigue:
        id === "sleep-fatigue" && recent >= 0
          ? [3, 5, 7][recent]
          : [2, 3, 2][index % 3],
      systolic: 120 + (index % 3),
      diastolic: 78 + (index % 2),
      temperature: [36.6, 36.7, 36.5][index % 3],
      spo2: index % 3 === 0 ? 99 : 98,
      mood: id === "heart-rate" && index === 20 ? "stressed" : "good",
      exercise: 60 + (index % 2) * 5,
      glucose: null,
      water: null,
      symptoms: [],
      notes: `Isolated synthetic scenario ${scenario.name}. Never saved to the demo repository.`,
      urgentSymptomReported: id === "heart-rate" && urgent && index === 20,
    });
  });
}
