import { DEMO_PROFILE_ID } from "../health/repository";
import { recordSchema, type HealthCheckIn } from "../health/validation";
import { dailyRecords } from "../insights/analyze";
import { scenarioDefinitions } from "../insights/scenarios";
import { normalizeQuestion } from "./intent";
import {
  shareIndicators,
  type DatasetKey,
  type HealthShare,
  type ShareIndicator,
} from "./types";
export function datasetProfileId(dataset: DatasetKey): string {
  return dataset === "saved"
    ? DEMO_PROFILE_ID
    : scenarioDefinitions.find((scenario) => scenario.id === dataset)!
        .profileId;
}
export function requestedIndicators(question: string): ShareIndicator[] {
  const text = normalizeQuestion(question);
  const result: ShareIndicator[] = [];
  if (/heart|pulse|bpm/.test(text)) result.push("heartRate");
  if (/sleep|slept|sleeping/.test(text)) result.push("sleep");
  if (/temperature|fever/.test(text)) result.push("temperature");
  if (/oxygen|spo2|saturation/.test(text)) result.push("spo2");
  if (/pressure|systolic|diastolic/.test(text))
    result.push("systolic", "diastolic");
  if (/fatigue|tired/.test(text)) result.push("fatigue");
  if (/exercise|activity|workout/.test(text)) result.push("exercise");
  if (/mood|stress|stressed/.test(text)) result.push("mood");
  return [...new Set(result)];
}
export function scopedRecords(
  records: readonly HealthCheckIn[],
  dataset: DatasetKey,
): HealthCheckIn[] {
  return records.filter(
    (record) =>
      record.profileId === datasetProfileId(dataset) &&
      ["synthetic", "user-entered-demo"].includes(record.source),
  );
}
export function makeHealthShare(
  question: string,
  records: readonly HealthCheckIn[],
  dataset: DatasetKey,
  asOf: string,
  minBaseline: number,
): HealthShare {
  const keys = requestedIndicators(question);
  const selected: ShareIndicator[] = keys.length ? keys : [...shareIndicators];
  const scoped = scopedRecords(records, dataset);
  return {
    dataset,
    asOf,
    minBaseline,
    indicators: selected,
    urgentReported: scoped.some((record) => record.urgentSymptomReported),
    records: dailyRecords(scoped)
      .slice(-31)
      .map((record) => {
        const values = Object.fromEntries(
          selected.map((key) => [key, record[key]]),
        );
        return {
          missionDate: record.missionDate,
          recordedAt: record.recordedAt,
          source: record.source as "synthetic" | "user-entered-demo",
          ...values,
        };
      }),
  };
}
export function expandHealthShare(share: HealthShare): HealthCheckIn[] {
  return share.records.map((record, index) =>
    recordSchema.parse({
      id: `40000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      profileId: datasetProfileId(share.dataset),
      missionDate: record.missionDate,
      recordedAt: record.recordedAt,
      createdAt: record.recordedAt,
      updatedAt: record.recordedAt,
      source: record.source,
      ...Object.fromEntries(
        shareIndicators.map((key) => [
          key,
          share.indicators.includes(key) ? (record[key] ?? null) : null,
        ]),
      ),
      glucose: null,
      water: null,
      symptoms: [],
      notes: "",
      urgentSymptomReported:
        share.urgentReported || record.urgentSymptomReported === true,
    }),
  );
}
