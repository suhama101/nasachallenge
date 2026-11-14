import { z } from "zod";
import { getKnowledgeEntry } from "../knowledge/content";
import { isMissionDate, moods } from "../health/validation";
export const datasetKeys = [
  "saved",
  "routine",
  "sleep-fatigue",
  "heart-rate",
] as const;
export const datasetKeySchema = z.enum(datasetKeys);
export type DatasetKey = z.output<typeof datasetKeySchema>;
export const shareIndicators = [
  "heartRate",
  "sleep",
  "temperature",
  "spo2",
  "systolic",
  "diastolic",
  "fatigue",
  "exercise",
  "mood",
] as const;
export type ShareIndicator = (typeof shareIndicators)[number];
const maybe = (min: number, max: number) =>
  z.number().min(min).max(max).nullable().optional();
export const compactRecordSchema = z
  .object({
    missionDate: z.string().refine(isMissionDate),
    recordedAt: z.iso.datetime({ offset: true }),
    source: z.enum(["synthetic", "user-entered-demo"]),
    heartRate: maybe(1, 350),
    sleep: maybe(0, 24),
    temperature: maybe(20, 50),
    spo2: maybe(0, 100),
    systolic: maybe(1, 400),
    diastolic: maybe(1, 300),
    fatigue: maybe(0, 10),
    exercise: maybe(0, 1440),
    mood: z.enum(moods).nullable().optional(),
    urgentSymptomReported: z.boolean().optional(),
  })
  .strict();
export const healthShareSchema = z
  .object({
    dataset: datasetKeySchema,
    asOf: z.iso.datetime({ offset: true }),
    minBaseline: z.number().int().min(3).max(30),
    indicators: z.array(z.enum(shareIndicators)).min(1).max(9),
    urgentReported: z.boolean(),
    records: z.array(compactRecordSchema).max(31),
  })
  .strict()
  .refine(
    (value) =>
      new Set(value.indicators).size === value.indicators.length &&
      value.records.every((record) =>
        Object.keys(record).every(
          (key) =>
            [
              "missionDate",
              "recordedAt",
              "source",
              "urgentSymptomReported",
            ].includes(key) || value.indicators.includes(key as ShareIndicator),
        ),
      ),
    "Health context contains unselected or duplicate indicators.",
  );
export type HealthShare = z.output<typeof healthShareSchema>;
export const assistantRequestSchema = z
  .object({
    question: z.string().trim().min(1).max(1600),
    useLive: z.boolean(),
    healthConsent: z.boolean(),
    health: healthShareSchema.optional(),
  })
  .strict()
  .refine((value) => !value.health || value.healthConsent, {
    path: ["healthConsent"],
    message: "Health context requires explicit consent.",
  });
export type AssistantRequest = z.output<typeof assistantRequestSchema>;
export const citationSchema = z
  .object({
    id: z.string(),
    title: z.string().max(200),
    organization: z.string().max(100),
    url: z.url(),
    version: z.string().max(30),
    verifiedOn: z.string().refine(isMissionDate),
  })
  .strict()
  .refine((value) => {
    const entry = getKnowledgeEntry(value.id);
    return (
      !!entry &&
      entry.sourceUrl === value.url &&
      entry.sourceTitle === value.title &&
      entry.organization === value.organization &&
      entry.version === value.version &&
      entry.lastVerified === value.verifiedOn
    );
  }, "Unrecognized curated source metadata.");
export type Citation = z.output<typeof citationSchema>;
export const answerSchema = z
  .object({
    category: z.enum([
      "education",
      "records",
      "explanation",
      "safety",
      "unsupported",
    ]),
    mode: z.enum(["local", "groq"]),
    reason: z.enum([
      "local",
      "unconfigured",
      "timeout",
      "provider-error",
      "malformed",
      "budget",
      "budget-unavailable",
      "network",
      "safety",
    ]),
    sections: z
      .array(
        z
          .object({
            id: z.string().max(100),
            kind: z.enum([
              "education",
              "recorded",
              "observation",
              "safety",
              "notice",
            ]),
            title: z.string().max(200),
            text: z.string().max(8000),
            sourceIds: z.array(z.string().max(100)).max(3),
          })
          .strict(),
      )
      .max(16),
    sources: z.array(citationSchema).max(3),
    limitations: z.array(z.string().max(2000)).max(10),
    nextStep: z.string().max(2000),
  })
  .strict()
  .refine(
    (value) =>
      value.sections.every((section) =>
        section.sourceIds.every((id) =>
          value.sources.some((source) => source.id === id),
        ),
      ),
    "Unknown answer citation.",
  );
export type AssistantAnswer = z.output<typeof answerSchema>;
export type AnswerSection = AssistantAnswer["sections"][number];
export const modelPlanSchema = z
  .object({ statementIds: z.array(z.string().min(1).max(100)).min(1).max(6) })
  .strict();
export type ModelPlan = z.output<typeof modelPlanSchema>;
export type ApprovedStatement = AnswerSection;
export const chatMessageSchema = z
  .object({
    id: z.uuid(),
    dataset: datasetKeySchema,
    role: z.enum(["user", "assistant"]),
    timestamp: z.iso.datetime({ offset: true }),
    text: z.string().max(1600).optional(),
    answer: answerSchema.optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.role === "user"
        ? !!value.text && !value.answer
        : !!value.answer && !value.text,
    "Invalid message shape.",
  );
export type ChatMessage = z.output<typeof chatMessageSchema>;
