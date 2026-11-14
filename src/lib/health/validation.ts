import { z } from "zod";

export const moods = ["calm", "good", "neutral", "stressed", "low"] as const;
export const symptoms = [
  "Headache",
  "Dizziness",
  "Nausea",
  "Fatigue",
  "Muscle discomfort",
  "Sleep difficulty",
  "Other",
] as const;

export function isMissionDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000"))
    return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

// Broad data-entry limits, NOT reference ranges, risk thresholds or diagnostic rules.
// Blank inputs stay absent: never coerce an empty string to zero.
const numeric = (min: number, max: number, integer = false) => {
  let schema = z
    .number({ error: "Enter a number." })
    .min(min, `Enter at least ${min}.`)
    .max(max, `Enter no more than ${max}.`);
  if (integer) schema = schema.int("Enter a whole number.");
  return schema;
};
const normalizeNumber = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return undefined;
  if (typeof value === "string")
    return value.trim() === "" ? undefined : Number(value);
  return value;
};
const inputNumber = (min: number, max: number, integer = false) =>
  z.preprocess(normalizeNumber, numeric(min, max, integer));
const optionalInputNumber = (min: number, max: number) =>
  z.preprocess(
    normalizeNumber,
    numeric(min, max)
      .nullable()
      .optional()
      .transform((v) => v ?? null),
  );

export const checkInInputSchema = z
  .object({
    missionDate: z
      .string()
      .refine(isMissionDate, "Choose a valid mission-local date."),
    heartRate: inputNumber(1, 350, true),
    systolic: inputNumber(1, 400, true),
    diastolic: inputNumber(1, 300, true),
    temperature: inputNumber(20, 50),
    spo2: inputNumber(0, 100),
    glucose: optionalInputNumber(1, 2000),
    sleep: inputNumber(0, 24),
    mood: z.enum(moods, { error: "Choose a mood." }),
    fatigue: inputNumber(0, 10, true),
    exercise: inputNumber(0, 1440, true),
    water: optionalInputNumber(0, 30),
    symptoms: z
      .array(z.enum(symptoms))
      .max(symptoms.length)
      .refine(
        (v) => new Set(v).size === v.length,
        "Select each symptom only once.",
      ),
    notes: z.string().trim().max(2000, "Use no more than 2,000 characters."),
    urgentSymptomReported: z.boolean().default(false),
  })
  .refine((v) => v.systolic > v.diastolic, {
    path: ["diastolic"],
    message:
      "Diastolic pressure must be lower than systolic pressure. Check the two entries.",
  });

export type CheckInInput = z.output<typeof checkInInputSchema>;

// Stored/imported records can contain unknown measurements. Null means missing, not zero.
export const recordSchema = z
  .object({
    id: z.uuid(),
    profileId: z.uuid(),
    missionDate: z.string().refine(isMissionDate),
    recordedAt: z.iso.datetime({ offset: true }),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
    source: z.enum(["synthetic", "user-entered-demo", "user-entered"]),
    heartRate: numeric(1, 350, true).nullable(),
    systolic: numeric(1, 400, true).nullable(),
    diastolic: numeric(1, 300, true).nullable(),
    temperature: numeric(20, 50).nullable(),
    spo2: numeric(0, 100).nullable(),
    glucose: numeric(1, 2000).nullable(),
    sleep: numeric(0, 24).nullable(),
    mood: z.enum(moods).nullable(),
    fatigue: numeric(0, 10, true).nullable(),
    exercise: numeric(0, 1440, true).nullable(),
    water: numeric(0, 30).nullable(),
    symptoms: z.array(z.enum(symptoms)).max(symptoms.length),
    notes: z.string().max(2000),
    urgentSymptomReported: z.boolean().default(false),
  })
  .refine(
    (v) =>
      v.systolic === null || v.diastolic === null || v.systolic > v.diastolic,
  );
export type HealthCheckIn = z.output<typeof recordSchema>;
