import type { HealthCheckInRow } from "./database.types";
import { DEMO_PROFILE_ID } from "./repository";
import {
  checkInInputSchema,
  recordSchema,
  type CheckInInput,
  type HealthCheckIn,
} from "./validation";

export function assertAuthenticatedRecord(
  record: HealthCheckIn,
  profileId: string,
): void {
  if (
    profileId === DEMO_PROFILE_ID ||
    record.profileId !== profileId ||
    record.source !== "user-entered"
  )
    throw new Error(
      "Demo records and other profiles cannot be used in authenticated storage.",
    );
}
export function fromDatabase(
  row: HealthCheckInRow,
  profileId: string,
): HealthCheckIn {
  const record = recordSchema.parse({
    id: row.id,
    profileId: row.astronaut_profile_id,
    recordedAt: row.recorded_at,
    missionDate: row.mission_local_date,
    heartRate: row.heart_rate,
    systolic: row.systolic,
    diastolic: row.diastolic,
    temperature: row.temperature,
    spo2: row.spo2,
    glucose: row.glucose,
    sleep: row.sleep,
    mood: row.mood,
    fatigue: row.fatigue,
    exercise: row.exercise,
    water: row.water,
    symptoms: row.symptoms,
    notes: row.notes,
    source: row.data_source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
  assertAuthenticatedRecord(record, profileId);
  return record;
}
export function toDatabase(
  input: CheckInInput,
  id: string,
  profileId: string,
  recordedAt: string,
): Omit<HealthCheckInRow, "created_at" | "updated_at"> {
  const value = checkInInputSchema.parse(input);
  const record = recordSchema.parse({
    ...value,
    id,
    profileId,
    recordedAt,
    createdAt: recordedAt,
    updatedAt: recordedAt,
    source: "user-entered",
  });
  assertAuthenticatedRecord(record, profileId);
  return {
    id: record.id,
    astronaut_profile_id: record.profileId,
    recorded_at: record.recordedAt,
    mission_local_date: record.missionDate,
    heart_rate: record.heartRate,
    systolic: record.systolic,
    diastolic: record.diastolic,
    temperature: record.temperature,
    spo2: record.spo2,
    glucose: record.glucose,
    sleep: record.sleep,
    mood: record.mood,
    fatigue: record.fatigue,
    exercise: record.exercise,
    water: record.water,
    symptoms: record.symptoms,
    notes: record.notes,
    data_source: record.source,
  };
}
