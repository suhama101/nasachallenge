import { createScenarioDataset } from "../src/lib/insights/scenarios";
import { recordSchema, type HealthCheckIn } from "../src/lib/health/validation";
export const AS_OF = "2026-11-14T12:00:00.000Z";
export const routine = () => createScenarioDataset("routine", AS_OF);
export const sleepFatigue = () => createScenarioDataset("sleep-fatigue", AS_OF);
export const elevatedHeart = () => createScenarioDataset("heart-rate", AS_OF);
export const withLatest = (
  rows: HealthCheckIn[],
  patch: Partial<HealthCheckIn>,
) =>
  rows.map((row, index) =>
    index === rows.length - 1 ? recordSchema.parse({ ...row, ...patch }) : row,
  );
