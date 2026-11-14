import type { HealthCheckIn } from "./validation";
export function newestFirst(
  records: readonly HealthCheckIn[],
): HealthCheckIn[] {
  return [...records].sort(
    (a, b) =>
      Date.parse(b.recordedAt) - Date.parse(a.recordedAt) ||
      b.id.localeCompare(a.id),
  );
}
export function latestRecord(
  records: readonly HealthCheckIn[],
): HealthCheckIn | null {
  return newestFirst(records)[0] ?? null;
}
export function hasCompleteCheckInForDate(
  records: readonly HealthCheckIn[],
  date: string,
): boolean {
  const required = [
    "heartRate",
    "systolic",
    "diastolic",
    "temperature",
    "spo2",
    "sleep",
    "mood",
    "fatigue",
    "exercise",
  ] as const;
  return records.some(
    (record) =>
      record.missionDate === date &&
      record.source !== "synthetic" &&
      required.every((key) => record[key] !== null),
  );
}
export function filterRecords(
  records: readonly HealthCheckIn[],
  from: string,
  to: string,
): HealthCheckIn[] {
  return newestFirst(records).filter(
    (r) => (!from || r.missionDate >= from) && (!to || r.missionDate <= to),
  );
}
export function chartRecords(
  records: readonly HealthCheckIn[],
): HealthCheckIn[] {
  return [...records].sort(
    (a, b) =>
      a.missionDate.localeCompare(b.missionDate) ||
      Date.parse(a.recordedAt) - Date.parse(b.recordedAt) ||
      a.id.localeCompare(b.id),
  );
}
export function average(
  records: readonly HealthCheckIn[],
  key: "heartRate" | "sleep" | "temperature" | "spo2",
): string | null {
  const values = records
    .map((r) => r[key])
    .filter((n): n is number => n !== null);
  return values.length
    ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
    : null;
}
export function sourceLabel(source: HealthCheckIn["source"]): string {
  return source === "synthetic"
    ? "Synthetic demo"
    : source === "user-entered-demo"
      ? "User-entered demo"
      : "User-entered";
}
export function measurement(
  value: number | null | undefined,
  unit: string,
): string {
  return value == null ? "Not recorded" : `${value} ${unit}`;
}
