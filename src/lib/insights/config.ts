export const numericIndicators = [
  "heartRate",
  "sleep",
  "temperature",
  "spo2",
  "systolic",
  "diastolic",
  "fatigue",
  "exercise",
] as const;
export type NumericIndicator = (typeof numericIndicators)[number];
export type Indicator = NumericIndicator | "mood";
export const indicators: Indicator[] = [...numericIndicators, "mood"];
export const indicatorConfig: Record<
  Indicator,
  {
    label: string;
    unit: string;
    digits: number;
    absoluteChange: number;
    relativeChange?: number;
    reference: string;
  }
> = {
  heartRate: {
    label: "Resting heart rate",
    unit: "bpm",
    digits: 0,
    absoluteChange: 8,
    relativeChange: 10,
    reference: "cardiovascular",
  },
  sleep: {
    label: "Sleep duration",
    unit: "hours",
    digits: 1,
    absoluteChange: 1,
    reference: "sleep",
  },
  temperature: {
    label: "Body temperature",
    unit: "°C",
    digits: 1,
    absoluteChange: 0.5,
    reference: "research",
  },
  spo2: {
    label: "SpO₂",
    unit: "%",
    digits: 1,
    absoluteChange: 2,
    reference: "research",
  },
  systolic: {
    label: "Systolic pressure",
    unit: "mmHg",
    digits: 0,
    absoluteChange: 15,
    reference: "cardiovascular",
  },
  diastolic: {
    label: "Diastolic pressure",
    unit: "mmHg",
    digits: 0,
    absoluteChange: 10,
    reference: "cardiovascular",
  },
  fatigue: {
    label: "Fatigue score",
    unit: "/ 10",
    digits: 0,
    absoluteChange: 2,
    reference: "behavioral",
  },
  exercise: {
    label: "Exercise duration",
    unit: "minutes",
    digits: 0,
    absoluteChange: 20,
    reference: "fitness",
  },
  mood: {
    label: "Mood",
    unit: "category",
    digits: 0,
    absoluteChange: 0,
    reference: "behavioral",
  },
};
export const defaultAnalysisConfig = {
  minBaseline: 5,
  baselineDays: 30,
  freshnessHours: 48,
  consecutiveDays: 3,
} as const;
export const categoryLabels = {
  stable: "Stable compared with baseline",
  change: "Change observed",
  review: "Review suggested",
  insufficient: "Insufficient information",
} as const;
export type MonitoringCategory = keyof typeof categoryLabels;
export function ruleDescription(key: Indicator): string {
  if (key === "mood")
    return "Current category differs from the historical mode. Review is suggested after three consecutive dates with the same changed category and an adequate earlier mode for each date. Mood has no numeric average or percentage change.";
  const rule = indicatorConfig[key];
  return `Absolute difference ≥ ${rule.absoluteChange} ${key === "spo2" ? "percentage points" : rule.unit}${rule.relativeChange ? ` AND relative difference ≥ ${rule.relativeChange}%` : ""}, versus baseline OR as the total monotonic change over the latest three consecutive daily readings. Review is suggested after three consecutive days meeting the same-direction baseline rule. These are unvalidated prototype comparison rules, not clinical limits or NASA standards.`;
}
