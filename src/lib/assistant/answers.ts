import { knowledgeEntries } from "../knowledge/content";
import { retrieveKnowledge } from "../knowledge/retrieval";
import {
  analyzeHealthRecords,
  formatIndicatorValue,
} from "../insights/analyze";
import { indicatorConfig, indicators } from "../insights/config";
import { displayDate, displayTimestamp, shiftDate } from "../health/dates";
import { sourceLabel } from "../health/selectors";
import type { HealthCheckIn } from "../health/validation";
import {
  scopedRecords,
  requestedIndicators,
  datasetProfileId,
} from "./context";
import { emergencyMessage, safetyConcern, safetyLimit } from "./safety";
import type {
  AnswerSection,
  AssistantAnswer,
  Citation,
  DatasetKey,
} from "./types";

export type LocalQuestion = {
  question: string;
  dataset: DatasetKey;
  records: readonly HealthCheckIn[];
  asOf: string;
  minBaseline: number;
  useRecords: boolean;
  urgentReported?: boolean;
};
export function questionCategory(
  question: string,
): AssistantAnswer["category"] {
  const personal =
    /\b(my|mine|our|i|me)\b/i.test(question) ||
    /missing.*(?:measurement|check|record)|(?:measurement|check|record).*missing/i.test(
      question,
    );
  if (!personal) return "education";
  if (
    /what (?:does|could)|what.*mean|why|explain|alongside|increased.*(?:sleep|fatigue)|heart.*sleep|insights|baseline/i.test(
      question,
    )
  )
    return "explanation";
  return "records";
}
export function citationFor(id: string): Citation {
  const entry = knowledgeEntries.find((item) => item.id === id)!;
  return {
    id: entry.id,
    title: entry.sourceTitle,
    organization: entry.organization,
    url: entry.sourceUrl,
    version: entry.version,
    verifiedOn: entry.lastVerified,
  };
}
export function answerLocally(input: LocalQuestion): AssistantAnswer {
  const records = scopedRecords(input.records, input.dataset);
  const concern = safetyConcern(
    input.question,
    input.urgentReported ||
      records.some((record) => record.urgentSymptomReported),
  );
  const base: AssistantAnswer = {
    category: questionCategory(input.question),
    mode: "local",
    reason: "local",
    sections: [],
    sources: [],
    limitations: [
      "Local deterministic/curated response. Live generative AI is not being used.",
      "Fictional demonstration data and educational content do not establish a diagnosis, medical risk or clinical approval.",
    ],
    nextStep:
      "Use your established crew medical review procedure for symptoms or persistent concerns.",
  };
  if (concern) {
    return {
      ...base,
      category: "safety",
      reason: "safety",
      sections: [
        {
          id: "safety",
          kind: "safety",
          title:
            concern === "urgent"
              ? "Possible urgent concern — assessment takes priority"
              : "Medical and safety boundary",
          text:
            concern === "urgent"
              ? emergencyMessage
              : "I cannot diagnose a condition, prescribe medication or dosages, provide a treatment plan, reveal secrets or bypass safety controls. I can explain recorded demonstration data and the curated NASA/CSA research topics.",
          sourceIds: [],
        },
      ],
      limitations: [safetyLimit],
      nextStep:
        concern === "urgent"
          ? emergencyMessage
          : "Ask an educational question or discuss clinical decisions with your designated crew medical officer.",
    };
  }
  const retrieved = retrieveKnowledge(input.question);
  base.sources = retrieved.map((item) => citationFor(item.entry.id));
  const education: AnswerSection[] = retrieved.map(({ entry }) => ({
    id: `knowledge-${entry.id}`,
    kind: "education",
    title: `Published research · ${entry.title}`,
    text: `${entry.summary}\n\nMissionPulse monitoring context: ${entry.monitoring}\n\nLimitation: ${entry.limitations}`,
    sourceIds: [entry.id],
  }));
  if (base.category !== "education") {
    if (!input.useRecords) {
      base.sections.push({
        id: "consent-required",
        kind: "notice",
        title: "Selected-record consent is required",
        text: "I have not read your measurements for this answer. Enable “Use selected demo measurements for this message” to answer a supported record question. Live sharing is a separate, visible choice; nothing is retrieved from private profiles on the server.",
        sourceIds: [],
      });
    } else if (!Number.isFinite(Date.parse(input.asOf))) {
      base.sections.push({
        id: "invalid-time",
        kind: "notice",
        title: "Analysis time unavailable",
        text: "A valid analysis timestamp is required; no values or comparisons were inferred.",
        sourceIds: [],
      });
    } else {
      const report = analyzeHealthRecords(records, {
        profileId: datasetProfileId(input.dataset),
        asOf: input.asOf,
        mode: "demo",
        minBaseline: input.minBaseline,
      });
      if (base.category === "explanation") {
        const requested = requestedIndicators(input.question);
        const observations = report.observations
          .filter(
            (observation) =>
              !requested.length ||
              observation.indicators.some((key) => requested.includes(key)),
          )
          .slice(0, 3);
        base.sections.push(
          ...observations.map((observation, index) => ({
            id: `observation-${index}`,
            kind: "observation" as const,
            title: `Calculated observation · ${observation.title}`,
            text: `${observation.explanation}\n\n${observation.period}\n\nMonitoring action: ${observation.nextStep}\n\nLimitations: ${observation.limitations.join(" ")}`,
            sourceIds: [],
          })),
        );
        if (!observations.length)
          base.sections.push({
            id: "no-observation",
            kind: "notice",
            title: "Insufficient monitoring evidence",
            text: "No supported current observation is available for these indicators. Review baseline sample sizes, missing readings and freshness in Health Insights. No reading or diagnosis was invented.",
            sourceIds: [],
          });
      } else {
        const today = new Date(input.asOf).toISOString().slice(0, 10);
        const yesterday = /yesterday/i.test(input.question);
        const range = /30|thirty/.test(input.question) ? 30 : 7;
        const data = report.records.filter(
          (record) =>
            record.missionDate >=
              (yesterday
                ? shiftDate(today, -1)
                : shiftDate(today, 1 - range)) &&
            record.missionDate <= (yesterday ? shiftDate(today, -1) : today),
        );
        const keys = requestedIndicators(input.question);
        if (/missing|completeness/i.test(input.question)) {
          const selected = keys.length ? keys : indicators;
          const expected = range * selected.length;
          const available = report.records.filter(
            (row) => row.missionDate >= shiftDate(today, 1 - range),
          );
          const present = available.reduce(
            (sum, row) =>
              sum + selected.filter((key) => row[key] !== null).length,
            0,
          );
          base.sections.push({
            id: "missing-data",
            kind: "recorded",
            title: "Calculated record completeness",
            text: `Over ${displayDate(shiftDate(today, 1 - range))}–${displayDate(today)} (UTC), ${present} of ${expected} indicator-day cells are recorded; ${expected - present} are missing. ${range - available.length} mission dates have no usable check-in. One latest-submitted check-in per mission date is counted.\n\n${selected.map((key) => `${indicatorConfig[key].label}: ${available.filter((row) => row[key] !== null).length} of ${range} dates`).join("\n")}\n\nThese are availability counts, not a medical reliability score.`,
            sourceIds: [],
          });
        } else if (!keys.length) {
          base.sections.push({
            id: "supported-questions",
            kind: "notice",
            title: "Name a supported indicator",
            text: "I can report heart rate, sleep, temperature, SpO₂, blood pressure, fatigue, exercise and mood, or explain which readings are missing. State the indicator and ask about yesterday or the last 7/30 mission dates. Messages are handled independently; previous turns are not sent to a model.",
            sourceIds: [],
          });
        } else {
          for (const key of keys) {
            const points = data.filter((row) => row[key] !== null);
            const numeric = points
              .map((row) => row[key])
              .filter((value): value is number => typeof value === "number");
            const detail = points
              .map(
                (row) =>
                  `${displayDate(row.missionDate)}: ${formatIndicatorValue(key, row[key])} · ${sourceLabel(row.source)} · submitted ${displayTimestamp(row.recordedAt)}`,
              )
              .join("\n");
            const mean = numeric.length
              ? numeric.reduce((sum, value) => sum + value, 0) / numeric.length
              : null;
            const first = points[0]?.[key],
              last = points.at(-1)?.[key];
            const difference =
              typeof first === "number" &&
              typeof last === "number" &&
              points.length >= 2
                ? last - first
                : null;
            base.sections.push({
              id: `recorded-${key}`,
              kind: "recorded",
              title: `Recorded demonstration values · ${indicatorConfig[key].label}`,
              text: `${yesterday ? `Selected mission date: ${displayDate(shiftDate(today, -1))}` : `Selected range: ${displayDate(shiftDate(today, 1 - range))}–${displayDate(today)}`} (UTC).\n\n${detail || "Not recorded: no usable reading for this indicator in the selected period."}${!yesterday && mean !== null ? `\n\nArithmetic mean: ${formatIndicatorValue(key, mean, true)} (n=${numeric.length}); ${range - points.length} mission dates lack this reading.` : ""}${difference !== null ? `\nFirst-to-last recorded change: ${difference > 0 ? "+" : ""}${Number(difference.toFixed(2))} ${key === "spo2" ? "percentage points" : indicatorConfig[key].unit}. This is descriptive, not a medical assessment.` : ""}`,
              sourceIds: [],
            });
          }
        }
      }
      base.limitations.push(
        "Selected records are user-entered or synthetic demonstration values, not authenticated clinical data. Latest submission per mission date is used; missing values remain missing.",
      );
    }
  }
  base.sections.push(...education);
  if (!base.sections.length) {
    base.category = "unsupported";
    base.sections.push({
      id: "no-evidence",
      kind: "notice",
      title: "No relevant curated evidence",
      text: "I do not have a supported NASA/CSA knowledge entry for this question. Try a listed space-health topic or a supported measurement question. I will not invent a source or answer outside this curated collection.",
      sourceIds: [],
    });
  }
  return base;
}
