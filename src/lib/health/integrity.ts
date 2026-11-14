import type { HealthCheckIn } from "./validation";
// A read-time quality rule only. Never write a replacement into a saved record.
export const spo2NeedsReview = (value: number | null | undefined) =>
  value != null && (!Number.isFinite(value) || value < 1 || value > 100);
export const usableSpo2 = (value: number | null | undefined): number | null =>
  value == null || spo2NeedsReview(value) ? null : value;
export const spo2ReviewMessage =
  "A saved SpO₂ reading is outside the current 1–100% entry rule and needs review. Its original value is preserved; it is excluded from charts, averages and baseline comparisons. Check the original entry and the measurement conditions. This is a data-quality flag, not a medical assessment.";
export function spo2Label(value: number | null | undefined): string {
  return value == null
    ? "Not recorded"
    : spo2NeedsReview(value)
      ? `${value} % — Needs review (excluded from calculations)`
      : `${value} %`;
}
export function usableMeasurement<K extends keyof HealthCheckIn>(
  record: HealthCheckIn,
  key: K,
): HealthCheckIn[K] | null {
  return key === "spo2" && spo2NeedsReview(record.spo2) ? null : record[key];
}
export const recordedMeasurementKeys = [
  "heartRate",
  "systolic",
  "diastolic",
  "temperature",
  "spo2",
  "glucose",
  "sleep",
  "mood",
  "fatigue",
  "exercise",
  "water",
] as const;
export function recordCoverage(record: HealthCheckIn) {
  return {
    recorded: recordedMeasurementKeys.filter(
      (key) => usableMeasurement(record, key) !== null,
    ).length,
    missing: recordedMeasurementKeys.filter((key) => record[key] === null)
      .length,
    review: spo2NeedsReview(record.spo2) ? 1 : 0,
  };
}
