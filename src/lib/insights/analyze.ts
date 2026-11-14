import { z } from "zod";
import { recordSchema, type HealthCheckIn } from "../health/validation";
import { shiftDate } from "../health/dates";
import {
  spo2NeedsReview,
  spo2Label,
  spo2ReviewMessage,
  usableSpo2,
} from "../health/integrity";
import {
  defaultAnalysisConfig,
  indicatorConfig,
  indicators,
  ruleDescription,
  type Indicator,
  type NumericIndicator,
} from "./config";
import {
  mean,
  median,
  percentageChange,
  regressionSlope,
  standardDeviation,
} from "./statistics";
import type {
  AnalysisOptions,
  AnalysisReport,
  Evidence,
  IndicatorAnalysis,
  InsightObservation,
  TimelineEntry,
} from "./types";

const DAY = 86_400_000;
const dayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / DAY;
const allowedSource = (source: unknown, mode: AnalysisOptions["mode"]) =>
  mode === "authenticated"
    ? source === "user-entered"
    : source === "synthetic" || source === "user-entered-demo";
export function formatIndicatorValue(
  key: Indicator,
  value: number | string | null,
  statistic = false,
): string {
  if (value === null) return "Not recorded";
  if (key === "spo2" && typeof value === "number" && spo2NeedsReview(value))
    return spo2Label(value);
  return typeof value === "number"
    ? `${statistic ? Number(value.toFixed(Math.max(1, indicatorConfig[key].digits))) : value} ${indicatorConfig[key].unit}`
    : value;
}
export function dailyRecords(
  records: readonly HealthCheckIn[],
): HealthCheckIn[] {
  const sorted = [...records].sort(
    (a, b) =>
      a.missionDate.localeCompare(b.missionDate) ||
      Date.parse(a.recordedAt) - Date.parse(b.recordedAt) ||
      a.id.localeCompare(b.id),
  );
  const days = new Map<string, HealthCheckIn>();
  sorted.forEach((row) => days.set(row.missionDate, row));
  return [...days.values()];
}
function evidence(row: HealthCheckIn, key: Indicator): Evidence | null {
  const value = row[key];
  return value === null
    ? null
    : {
        id: row.id,
        missionDate: row.missionDate,
        recordedAt: row.recordedAt,
        source: row.source,
        indicator: key,
        value,
        role: "current",
      };
}
function categoricalMode(points: Evidence[]): string | null {
  if (!points.length) return null;
  const counts = new Map<string, number>();
  points.forEach((p) =>
    counts.set(String(p.value), (counts.get(String(p.value)) ?? 0) + 1),
  );
  const maximum = Math.max(...counts.values());
  return String(
    [...points].reverse().find((p) => counts.get(String(p.value)) === maximum)!
      .value,
  );
}
function baselineFor(
  rows: HealthCheckIn[],
  key: Indicator,
  date: string,
  days: number,
  min: number,
) {
  const points = rows
    .filter(
      (row) =>
        row.missionDate < date && row.missionDate >= shiftDate(date, -days),
    )
    .map((row) => evidence(row, key))
    .filter((p): p is Evidence => p !== null)
    .map((point) => ({ ...point, role: "baseline" as const }));
  const baseline =
    points.length < min
      ? null
      : key === "mood"
        ? categoricalMode(points)
        : median(points.map((p) => p.value as number));
  return { points, baseline };
}
export function meetsChangeRule(
  key: NumericIndicator,
  current: number,
  baseline: number,
): boolean {
  const rule = indicatorConfig[key];
  const delta = Math.abs(current - baseline);
  const percent = percentageChange(current, baseline);
  return (
    delta + 1e-9 >= rule.absoluteChange &&
    (rule.relativeChange === undefined ||
      (percent !== null && Math.abs(percent) + 1e-9 >= rule.relativeChange))
  );
}
function consecutive(
  rows: HealthCheckIn[],
  key: NumericIndicator,
): IndicatorAnalysis["consecutive"] {
  if (rows.length < 2) return { direction: "none", intervals: 0 };
  let direction: "up" | "down" | "none" = "none";
  let intervals = 0;
  for (let i = rows.length - 1; i > 0; i--) {
    const current = rows[i],
      previous = rows[i - 1];
    const a = current[key],
      b = previous[key];
    if (
      a === null ||
      b === null ||
      dayNumber(current.missionDate) - dayNumber(previous.missionDate) !== 1 ||
      a === b
    )
      break;
    const next = a > b ? "up" : "down";
    if (direction !== "none" && next !== direction) break;
    direction = next;
    intervals++;
  }
  return { direction, intervals };
}
function normalized(
  input: readonly unknown[],
  options: AnalysisOptions,
  validClock: boolean,
) {
  const quality = {
    invalid: 0,
    future: 0,
    otherProfile: 0,
    otherSource: 0,
    duplicate: 0,
    conflicting: 0,
    sameDay: 0,
    missingDays7: 7,
    completeCells7: 0,
    expectedCells7: 7 * indicators.length,
    days7: 0,
  };
  const byId = new Map<string, HealthCheckIn>();
  const conflicts = new Set<string>();
  const urgent = new Set<string>();
  for (const raw of input) {
    if (!raw || typeof raw !== "object") {
      quality.invalid++;
      continue;
    }
    const candidate = raw as Record<string, unknown>;
    if (candidate.profileId !== options.profileId) {
      quality.otherProfile++;
      continue;
    }
    if (!allowedSource(candidate.source, options.mode)) {
      quality.otherSource++;
      continue;
    }
    // A user-declared urgent report is never silenced by a bad vital sign or timestamp.
    if (candidate.urgentSymptomReported === true)
      urgent.add(
        typeof candidate.id === "string"
          ? candidate.id
          : `unverified-${urgent.size + 1}`,
      );
    const result = recordSchema.safeParse(raw);
    if (!result.success) {
      quality.invalid++;
      continue;
    }
    const row = result.data;
    if (!validClock) {
      continue;
    }
    const asOf = Date.parse(options.asOf);
    if (
      [row.recordedAt, row.createdAt, row.updatedAt].some(
        (stamp) => !Number.isFinite(Date.parse(stamp)),
      )
    ) {
      quality.invalid++;
      continue;
    }
    if (
      [row.recordedAt, row.createdAt, row.updatedAt].some(
        (stamp) => Date.parse(stamp) > asOf,
      ) ||
      row.missionDate > new Date(asOf).toISOString().slice(0, 10)
    ) {
      quality.future++;
      continue;
    }
    const previous = byId.get(row.id);
    if (previous) {
      quality.duplicate++;
      if (JSON.stringify(previous) !== JSON.stringify(row))
        conflicts.add(row.id);
    } else byId.set(row.id, row);
  }
  quality.conflicting = conflicts.size;
  const unique = [...byId.values()].filter((row) => !conflicts.has(row.id));
  const records = dailyRecords(unique);
  quality.sameDay = unique.length - records.length;
  return { records, quality, urgent: [...urgent] };
}

export function analyzeHealthRecords(
  input: readonly unknown[],
  options: AnalysisOptions,
): AnalysisReport {
  const configuration = {
    minBaseline:
      Number.isInteger(options.minBaseline) &&
      options.minBaseline! >= 3 &&
      options.minBaseline! <= 30
        ? options.minBaseline!
        : defaultAnalysisConfig.minBaseline,
    baselineDays:
      Number.isInteger(options.baselineDays) &&
      options.baselineDays! >= 1 &&
      options.baselineDays! <= 90
        ? options.baselineDays!
        : defaultAnalysisConfig.baselineDays,
    freshnessHours:
      Number.isFinite(options.freshnessHours) && options.freshnessHours! > 0
        ? options.freshnessHours!
        : defaultAnalysisConfig.freshnessHours,
  };
  const validClock =
    z.iso.datetime({ offset: true }).safeParse(options.asOf).success &&
    Number.isFinite(Date.parse(options.asOf));
  const {
    records: originalRecords,
    quality,
    urgent,
  } = normalized(input, options, validClock);
  // Explicit analysis view: preserve original records in the report and storage.
  // Only this uncertain measurement is excluded; other measurements still count.
  const records = originalRecords.map((row) =>
    spo2NeedsReview(row.spo2) ? { ...row, spo2: usableSpo2(row.spo2) } : row,
  );
  const current = records.at(-1) ?? null;
  const today = validClock
    ? new Date(options.asOf).toISOString().slice(0, 10)
    : null;
  const recent7 = today
    ? records.filter((row) => row.missionDate >= shiftDate(today, -6))
    : [];
  const recent30 = today
    ? records.filter((row) => row.missionDate >= shiftDate(today, -29))
    : [];
  quality.days7 = recent7.length;
  quality.missingDays7 = 7 - quality.days7;
  quality.completeCells7 = recent7.reduce(
    (total, row) =>
      total + indicators.filter((key) => row[key] !== null).length,
    0,
  );
  const submissionAgeHours = current
    ? (Date.parse(options.asOf) - Date.parse(current.recordedAt)) / 3_600_000
    : null;
  const missionAgeDays =
    current && today ? dayNumber(today) - dayNumber(current.missionDate) : null;
  const stale =
    !validClock ||
    !current ||
    submissionAgeHours === null ||
    submissionAgeHours > configuration.freshnessHours ||
    missionAgeDays === null ||
    missionAgeDays >= 2;
  const limitations = [
    "Research demonstration; descriptive monitoring only. No clinical validation or NASA endorsement.",
    "One latest-submitted check-in per mission date is used; earlier same-day entries remain in Health History.",
    "All usable values are retained. A rolling median reduces influence of extremes but cannot certify a physiological baseline.",
    options.mode === "authenticated"
      ? "Submission time is not a device measurement time. Your selected mission dates use the UTC calendar."
      : "Submission time is not a device measurement time. Mission dates use the fictional mission’s UTC calendar.",
  ];
  if (originalRecords.some((row) => spo2NeedsReview(row.spo2)))
    limitations.push(spo2ReviewMessage);
  if (!validClock)
    limitations.push(
      "Analysis clock is invalid; no statistical assessment was generated.",
    );
  if (quality.invalid || quality.conflicting || quality.future)
    limitations.push(
      `${quality.invalid} invalid records, ${quality.conflicting} conflicting IDs and ${quality.future} future-dated records excluded. No values were repaired or invented.`,
    );
  if (stale)
    limitations.push(
      "Current data is absent or stale under the prototype freshness rule (submission older than 48 hours or mission date at least two days old by default). Categories cannot describe current condition.",
    );
  const metrics: IndicatorAnalysis[] = indicators.map((key) => {
    const point = current ? evidence(current, key) : null;
    const history = current
      ? baselineFor(
          records,
          key,
          current.missionDate,
          configuration.baselineDays,
          configuration.minBaseline,
        )
      : { points: [], baseline: null };
    const baseline = history.baseline;
    const points7 = recent7
      .map((row) => evidence(row, key))
      .filter((p): p is Evidence => p !== null);
    const points30 = recent30
      .map((row) => evidence(row, key))
      .filter((p): p is Evidence => p !== null);
    const numeric7 =
      key === "mood" ? [] : points7.map((p) => p.value as number);
    const numeric30 =
      key === "mood" ? [] : points30.map((p) => p.value as number);
    const changes =
      key === "mood"
        ? { direction: "none" as const, intervals: 0 }
        : consecutive(recent7, key);
    let repeatedDeviations = 0;
    if (point && baseline !== null) {
      if (key === "mood") {
        if (point.value !== baseline)
          for (let i = records.length - 1; i >= 0; i--) {
            const row = records[i];
            const prior = baselineFor(
              records,
              key,
              row.missionDate,
              configuration.baselineDays,
              configuration.minBaseline,
            ).baseline;
            if (
              typeof prior !== "string" ||
              row.mood === prior ||
              row.mood !== point.value ||
              dayNumber(current!.missionDate) - dayNumber(row.missionDate) !==
                repeatedDeviations
            )
              break;
            repeatedDeviations++;
          }
      } else {
        const direction = Math.sign(
          (point.value as number) - (baseline as number),
        );
        for (let i = records.length - 1; i >= 0; i--) {
          const row = records[i];
          const prior = baselineFor(
            records,
            key,
            row.missionDate,
            configuration.baselineDays,
            configuration.minBaseline,
          ).baseline;
          if (
            row[key] === null ||
            typeof prior !== "number" ||
            dayNumber(current!.missionDate) - dayNumber(row.missionDate) !==
              repeatedDeviations ||
            !meetsChangeRule(key, row[key]!, prior) ||
            Math.sign(row[key]! - prior) !== direction
          )
            break;
          repeatedDeviations++;
        }
      }
    }
    const outlierIds: string[] = [];
    if (key !== "mood" && typeof baseline === "number") {
      const mad =
        median(
          history.points.map((p) => Math.abs((p.value as number) - baseline)),
        ) ?? 0;
      const bound = Math.max(
        3 * 1.4826 * mad,
        indicatorConfig[key].absoluteChange * 3,
      );
      history.points.forEach((p) => {
        if (Math.abs((p.value as number) - baseline) > bound)
          outlierIds.push(p.id);
      });
    }
    let category: IndicatorAnalysis["category"] = "insufficient";
    if (point && baseline !== null && !stale) {
      const changed =
        key === "mood"
          ? point.value !== baseline
          : meetsChangeRule(key, point.value as number, baseline as number);
      const suffix = recent7.slice(-3);
      const sustained =
        key !== "mood" &&
        changes.intervals >= 2 &&
        suffix.length === 3 &&
        suffix[0][key] !== null &&
        meetsChangeRule(key, point.value as number, suffix[0][key]!);
      category =
        repeatedDeviations >= 3
          ? "review"
          : changed || sustained
            ? "change"
            : "stable";
    }
    const notes = [
      "This category describes the comparison rule, not medical status.",
    ];
    if (baseline === null)
      notes.push(
        `Insufficient baseline data: ${history.points.length} valid earlier days; ${configuration.minBaseline} required.`,
      );
    if (!point)
      notes.push(
        "The current check-in has no reading for this indicator. No older value was substituted.",
      );
    if (stale)
      notes.push(
        "Reading is absent or stale; no current-condition interpretation is made.",
      );
    if (outlierIds.length)
      notes.push(
        `${outlierIds.length} statistically distant baseline values noted and retained; these are not assumed erroneous.`,
      );
    if (new Set(history.points.map((p) => p.source)).size > 1)
      notes.push(
        "Baseline combines clearly labeled synthetic and user-entered demo values; it is not a real astronaut baseline.",
      );
    if (key === "mood")
      notes.push(
        "Historical mode, with ties resolved by the most recent tied category. No numeric ranking, average or percentage is assigned to mood.",
      );
    if (typeof baseline === "number" && baseline === 0)
      notes.push(
        "Relative percentage change is undefined for a zero baseline; absolute differences are still shown.",
      );
    return {
      key,
      current: point,
      baseline,
      baselineCount: history.points.length,
      baselineEvidence: history.points,
      baselineFrom: history.points[0]?.missionDate ?? null,
      baselineTo: history.points.at(-1)?.missionDate ?? null,
      percentageChange:
        point && typeof point.value === "number" && typeof baseline === "number"
          ? percentageChange(point.value, baseline)
          : null,
      difference:
        point && typeof point.value === "number" && typeof baseline === "number"
          ? point.value - baseline
          : null,
      rolling7: key === "mood" ? null : mean(numeric7),
      rolling30: key === "mood" ? null : mean(numeric30),
      rolling7Count: numeric7.length,
      rolling30Count: numeric30.length,
      variability: key === "mood" ? null : standardDeviation(numeric7),
      slope:
        key === "mood"
          ? null
          : regressionSlope(
              points7.map((p) => ({
                day: dayNumber(p.missionDate),
                value: p.value as number,
              })),
            ),
      trendSamples: points7.length,
      consecutive: changes,
      repeatedDeviations,
      outlierIds,
      category,
      limitations: notes,
    };
  });
  let observations: InsightObservation[] = metrics
    .filter((metric) => metric.category !== "insufficient")
    .map((metric) => {
      const point = metric.current!;
      const config = indicatorConfig[metric.key];
      const isStable = metric.category === "stable";
      return {
        id: `indicator-${metric.key}-${point.id}`,
        kind: "indicator",
        indicators: [metric.key],
        category: metric.category,
        title: `${config.label}: ${isStable ? "limited change against baseline" : metric.category === "review" ? "repeated change observed" : "change observed"}`,
        explanation: `The current recorded value is ${formatIndicatorValue(metric.key, point.value)}. The ${metric.key === "mood" ? "mode" : "median"} of ${metric.baselineCount} earlier daily readings is ${formatIndicatorValue(metric.key, metric.baseline, true)}.${metric.repeatedDeviations >= 3 ? ` The same-direction baseline change rule was met on ${metric.repeatedDeviations} consecutive mission dates.` : ""}${metric.key !== "mood" && metric.consecutive.intervals >= 2 ? ` The latest ${metric.consecutive.intervals + 1} consecutive daily readings move ${metric.consecutive.direction} without a reversal.` : ""} This is an observation, not a diagnosis.`,
        comparison: `Current check-in ${point.id}; baseline excludes all readings on the current mission date.`,
        period: `Current mission date ${point.missionDate}; baseline ${metric.baselineFrom} through ${metric.baselineTo}.`,
        evidence: [point, ...metric.baselineEvidence],
        limitations: metric.limitations,
        nextStep: isStable
          ? "Continue recording consistently under comparable conditions. A small statistical difference does not rule out symptoms or a medical problem."
          : "Verify the entry, units and measurement conditions; record relevant context. Discuss persistent changes or symptoms through the crew’s established medical review procedure. Do not change treatment from this comparison.",
        references: [config.reference],
        rule: ruleDescription(metric.key),
      };
    });
  const paired = recent7.slice(-3);
  const contiguous =
    paired.length === 3 &&
    dayNumber(paired[2].missionDate) - dayNumber(paired[0].missionDate) === 2;
  function combined(
    id: string,
    keys: Indicator[],
    title: string,
    explanation: string,
    rule: string,
  ) {
    if (!contiguous) return;
    observations.push({
      id: `${id}-${paired[2].id}`,
      kind: "combination",
      indicators: keys,
      category: "review",
      title,
      explanation: `${explanation} These changes occurred together; the available data cannot establish a cause.`,
      comparison:
        "The last three distinct consecutive mission dates, with an available earlier baseline for both numeric indicators.",
      period: `${paired[0].missionDate} through ${paired[2].missionDate}`,
      evidence: paired.flatMap((row) =>
        keys
          .map((key) => evidence(row, key))
          .filter((p): p is Evidence => p !== null)
          .map((point) => ({ ...point, role: "pattern" as const })),
      ),
      limitations: [
        "Only three daily observations support this pattern; no causal inference or medical-risk estimate is made.",
        "Self-reported duration and ratings can vary with reporting conditions.",
      ],
      nextStep:
        "Verify entries and conditions, keep recording the context, and use the crew’s established medical review procedure for persistent changes or symptoms.",
      references: keys.includes("sleep")
        ? ["sleep", "behavioral"]
        : ["fitness", "behavioral"],
      rule,
    });
  }
  if (contiguous) {
    const [a, b, c] = paired;
    const hasBaseline = (key: Indicator) =>
      metrics.find((metric) => metric.key === key)?.baseline !== null;
    if (
      [a, b, c].every((r) => r.sleep !== null && r.fatigue !== null) &&
      hasBaseline("sleep") &&
      hasBaseline("fatigue") &&
      a.sleep! > b.sleep! &&
      b.sleep! > c.sleep! &&
      c.fatigue! > b.fatigue! &&
      b.fatigue! > a.fatigue! &&
      a.sleep! - c.sleep! >= 1 - 1e-9 &&
      c.fatigue! - a.fatigue! >= 2
    ) {
      combined(
        "sleep-fatigue",
        ["sleep", "fatigue"],
        "Sleep decreased alongside increased fatigue",
        `Sleep changed from ${a.sleep} to ${c.sleep} hours while fatigue changed from ${a.fatigue} to ${c.fatigue} / 10 over three check-ins.`,
        "Three consecutive mission dates; sleep decreases at each step by ≥ 1 hour in total and fatigue rises at each step by ≥ 2 points in total. Prototype rule, not a clinical threshold.",
      );
    }
    if (
      [a, b, c].every((r) => r.exercise !== null && r.fatigue !== null) &&
      hasBaseline("exercise") &&
      hasBaseline("fatigue") &&
      a.exercise! > b.exercise! &&
      b.exercise! > c.exercise! &&
      c.fatigue! > b.fatigue! &&
      b.fatigue! > a.fatigue! &&
      a.exercise! - c.exercise! >= 20 &&
      c.fatigue! - a.fatigue! >= 2
    ) {
      combined(
        "exercise-fatigue",
        ["exercise", "fatigue"],
        "Less recorded exercise alongside increased fatigue",
        `Exercise changed from ${a.exercise} to ${c.exercise} minutes while fatigue changed from ${a.fatigue} to ${c.fatigue} / 10.`,
        "Three consecutive mission dates; exercise falls at each step by ≥ 20 minutes in total and fatigue rises by ≥ 2 points in total. Prototype rule, not a clinical threshold.",
      );
    }
  }
  const heart = metrics.find((metric) => metric.key === "heartRate")!;
  if (
    current?.mood === "stressed" &&
    heart.current &&
    typeof heart.baseline === "number" &&
    (heart.current.value as number) > heart.baseline &&
    ["change", "review"].includes(heart.category)
  ) {
    observations.push({
      id: `heart-stress-${current.id}`,
      kind: "combination",
      indicators: ["heartRate", "mood"],
      category: "review",
      title: "Heart-rate change alongside reported stress",
      explanation: `Resting heart rate is ${current.heartRate} bpm versus a prior median of ${heart.baseline} bpm; the same check-in reports mood as stressed. These co-occur; this does not establish a cause.`,
      comparison: `${heart.baselineCount} earlier daily heart-rate readings and the current mood category.`,
      period: `Baseline ${heart.baselineFrom} through ${heart.baselineTo}; current ${current.missionDate}.`,
      evidence: [
        heart.current,
        ...heart.baselineEvidence,
        evidence(current, "mood")!,
      ],
      limitations: [
        "A single mood report does not explain the heart-rate change or diagnose psychological stress.",
      ],
      nextStep:
        "Verify measurement conditions and share symptoms or persistent changes through the crew’s established medical review procedure.",
      references: ["cardiovascular", "behavioral"],
      rule:
        ruleDescription("heartRate") +
        " Current mood is explicitly reported as stressed.",
    });
  }
  if (urgent.length) {
    observations = [
      {
        id: `urgent-${options.profileId}`,
        kind: "urgent",
        indicators: [],
        category: "review",
        title: "Urgent symptom reported — immediate assessment",
        explanation:
          "An urgent-symptom flag was explicitly reported in this selected dataset. Statistical comparisons cannot rule out an emergency, even when values resemble a baseline.",
        comparison:
          "Urgency is user-declared, not inferred from a numeric threshold or free-text notes.",
        period:
          "Applies while an urgent report is present; this prototype does not track symptom resolution.",
        evidence: [],
        limitations: [
          "No approved medical escalation protocol is configured in MissionPulse.",
          "Urgency takes priority even if the associated reading or timestamp is unusable. No treatment instructions are generated.",
        ],
        nextStep:
          "Seek immediate assessment through the crew’s established medical emergency procedure. Do not wait for a statistical result or another check-in.",
        references: [],
        rule: "Explicit urgent-symptom report overrides the statistical observation list. This is a safety fallback, not a clinical diagnosis.",
      },
    ];
  }
  const rank = { review: 0, change: 1, stable: 2, insufficient: 3 };
  observations.sort(
    (a, b) =>
      rank[a.category] - rank[b.category] ||
      (a.kind === "combination" ? -1 : 0) -
        (b.kind === "combination" ? -1 : 0) ||
      indicators.indexOf(a.indicators[0]) -
        indicators.indexOf(b.indicators[0]) ||
      a.id.localeCompare(b.id),
  );
  return {
    profileId: options.profileId,
    asOf: options.asOf,
    validClock,
    records: originalRecords,
    current: originalRecords.at(-1) ?? null,
    metrics,
    observations,
    urgentRecordIds: urgent,
    quality,
    submissionAgeHours,
    missionAgeDays,
    stale,
    limitations,
    configuration,
  };
}

export function observationTimeline(
  input: readonly unknown[],
  options: AnalysisOptions,
  days: 7 | 30,
): TimelineEntry[] {
  const latest = analyzeHealthRecords(input, options);
  if (!latest.validClock) return [];
  const today = new Date(options.asOf).toISOString().slice(0, 10);
  const start = shiftDate(today, 1 - days);
  return latest.records
    .filter((row) => row.missionDate >= start)
    .map((row) => {
      const cutoff = new Date(
        Math.min(
          Date.parse(`${row.missionDate}T23:59:59.999Z`),
          Date.parse(options.asOf),
        ),
      ).toISOString();
      const available = input.filter((raw) => {
        if (!raw || typeof raw !== "object") return false;
        const value = raw as Record<string, unknown>;
        return (
          typeof value.recordedAt === "string" &&
          Number.isFinite(Date.parse(value.recordedAt)) &&
          Date.parse(value.recordedAt) <= Date.parse(cutoff)
        );
      });
      const report = analyzeHealthRecords(available, {
        ...options,
        asOf: cutoff,
      });
      return {
        missionDate: row.missionDate,
        asOf: cutoff,
        stable: report.observations.filter((o) => o.category === "stable")
          .length,
        change: report.observations.filter((o) => o.category === "change")
          .length,
        review: report.observations.filter((o) => o.category === "review")
          .length,
        titles: report.observations
          .filter((o) => o.category !== "stable")
          .map((o) => o.title),
        evidenceIds: [
          ...new Set(
            report.observations.flatMap((o) => o.evidence.map((e) => e.id)),
          ),
        ],
        urgent: report.urgentRecordIds.length > 0,
      };
    });
}
