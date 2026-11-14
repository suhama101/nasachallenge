import { trends } from "../mock-data";
import { shiftDate } from "./dates";
import { DEMO_PROFILE_ID } from "./repository";
import { recordSchema, type HealthCheckIn } from "./validation";
export function createSeedRecords(anchorDate: string): HealthCheckIn[] {
  return trends.map((point, index) => {
    const missionDate = shiftDate(anchorDate, index - trends.length);
    const timestamp = `${missionDate}T07:30:00.000Z`;
    return recordSchema.parse({
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      profileId: DEMO_PROFILE_ID,
      missionDate,
      recordedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
      source: "synthetic",
      heartRate: point.heartRate,
      sleep: point.sleep,
      systolic: 118 + (index % 5),
      diastolic: 76 + (index % 4),
      temperature: 36.5 + (index % 3) / 10,
      spo2: index % 4 === 0 ? 97 : 98,
      glucose: null,
      mood: "good",
      fatigue: 2 + (index % 3),
      exercise: 60 + (index % 3) * 15,
      water: index % 3 === 0 ? null : 2.3,
      symptoms: [],
      notes: "Fictional baseline record. Not measured by a device.",
    });
  });
}
