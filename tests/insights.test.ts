import { describe, expect, it } from "vitest";
import {
  analyzeHealthRecords,
  formatIndicatorValue,
  dailyRecords,
  meetsChangeRule,
  observationTimeline,
} from "../src/lib/insights/analyze";
import { defaultAnalysisConfig } from "../src/lib/insights/config";
import {
  median,
  percentageChange,
  regressionSlope,
  standardDeviation,
} from "../src/lib/insights/statistics";
import { createScenarioDataset } from "../src/lib/insights/scenarios";
import {
  AS_OF,
  routine,
  sleepFatigue,
  elevatedHeart,
  withLatest,
} from "./insights.fixtures";
import type { AnalysisOptions } from "../src/lib/insights/types";
import type { HealthCheckIn } from "../src/lib/health/validation";
const analyze = (
  rows: readonly unknown[],
  overrides: Partial<AnalysisOptions> = {},
) =>
  analyzeHealthRecords(rows, {
    profileId: routine()[0].profileId,
    asOf: AS_OF,
    ...overrides,
  });
const forRows = (
  rows: HealthCheckIn[],
  overrides: Partial<AnalysisOptions> = {},
) => analyze(rows, { profileId: rows[0].profileId, ...overrides });

describe("statistics and measurement-specific comparisons", () => {
  it("preserves reported numeric precision and only rounds computed statistics", () => {
    expect(formatIndicatorValue("temperature", 36.625)).toBe("36.625 °C");
    expect(formatIndicatorValue("temperature", 36.625, true)).toBe("36.6 °C");
    const rows = withLatest(routine(), { sleep: 5.25 });
    expect(
      forRows(rows).observations.find((o) =>
        o.id.startsWith("indicator-sleep-"),
      )?.explanation,
    ).toContain("5.25 hours");
  });
  it("calculates odd/even medians without changing the input", () => {
    const list = [7, 1, 3, 5];
    expect(median(list)).toBe(4);
    expect(list).toEqual([7, 1, 3, 5]);
    expect(median([5, 1, 9])).toBe(5);
    expect(median([])).toBeNull();
  });
  it("handles zero baselines and invalid numbers without Infinity/NaN", () => {
    expect(percentageChange(3, 0)).toBeNull();
    expect(percentageChange(110, 100)).toBe(10);
    expect(percentageChange(NaN, 3)).toBeNull();
  });
  it("calculates variability and regression against actual elapsed days", () => {
    expect(standardDeviation([2, 2, 2])).toBe(0);
    expect(standardDeviation([2])).toBeNull();
    expect(standardDeviation([2, NaN, 2])).toBe(0);
    expect(
      regressionSlope([
        { day: 0, value: 1 },
        { day: 2, value: 5 },
        { day: 5, value: 11 },
      ]),
    ).toBe(2);
    expect(regressionSlope([{ day: 0, value: 1 }])).toBeNull();
  });
  it("uses units/percentage points, not one universal percentage rule", () => {
    expect(meetsChangeRule("temperature", 37.1, 36.6)).toBe(true);
    expect(meetsChangeRule("spo2", 96, 98)).toBe(true);
    expect(meetsChangeRule("heartRate", 77, 72)).toBe(false);
    expect(meetsChangeRule("sleep", 6.5, 7.6)).toBe(true);
    expect(meetsChangeRule("fatigue", 4, 2)).toBe(true);
    expect(meetsChangeRule("exercise", 20, 0)).toBe(true);
  });
});

describe("personal baselines and data integrity", () => {
  it("calculates a rolling median from earlier dates, excluding current", () => {
    const rows = withLatest(routine(), { heartRate: 200 });
    const report = forRows(rows);
    const heart = report.metrics.find((m) => m.key === "heartRate")!;
    expect(heart.baseline).toBe(
      median(rows.slice(0, -1).map((r) => r.heartRate!)),
    );
    expect(heart.baselineCount).toBe(20);
    expect(
      heart.baselineEvidence.every((point) => point.id !== rows.at(-1)!.id),
    ).toBe(true);
    expect(heart.baselineFrom).toBe("2026-10-25");
    expect(heart.baselineTo).toBe("2026-11-13");
  });
  it("requires a configurable minimum of distinct historical days", () => {
    const rows = routine().slice(-5);
    expect(forRows(rows).metrics.every((m) => m.baseline === null)).toBe(true);
    expect(forRows(rows).observations).toEqual([]);
    expect(forRows(rows, { minBaseline: 3 }).metrics[0].baselineCount).toBe(4);
    expect(
      forRows(rows, { minBaseline: 3 }).metrics[0].baseline,
    ).not.toBeNull();
    expect(forRows(rows, { minBaseline: 1 }).configuration.minBaseline).toBe(
      defaultAnalysisConfig.minBaseline,
    );
  });
  it("handles missing current measurements without using an older value", () => {
    const report = forRows(
      withLatest(routine(), { heartRate: null, sleep: null }),
    );
    const heart = report.metrics.find((m) => m.key === "heartRate")!;
    expect(heart.current).toBeNull();
    expect(heart.category).toBe("insufficient");
    expect(
      report.observations.some((o) => o.indicators.includes("heartRate")),
    ).toBe(false);
  });
  it("keeps explicit zeros and null relative changes for a zero baseline", () => {
    const rows = withLatest(
      routine().map((r) => ({ ...r, exercise: 0 })),
      { exercise: 25 },
    );
    const metric = forRows(rows).metrics.find((m) => m.key === "exercise")!;
    expect(metric.baseline).toBe(0);
    expect(metric.percentageChange).toBeNull();
    expect(metric.difference).toBe(25);
    expect(metric.category).toBe("change");
  });
  it("sorts correctly independent of input ordering", () => {
    const rows = elevatedHeart();
    expect(forRows(rows)).toEqual(forRows([...rows].reverse()));
  });
  it("uses the latest submission per day and excludes the whole current date from baseline", () => {
    const rows = routine();
    const current = rows.at(-1)!;
    const extra = {
      ...current,
      id: "77777777-7777-4777-8777-777777777777",
      recordedAt: "2026-11-14T11:00:00Z",
      heartRate: 150,
    };
    const report = forRows([...rows, extra]);
    expect(report.current!.id).toBe(extra.id);
    expect(report.metrics[0].baselineCount).toBe(20);
    expect(
      report.metrics[0].baselineEvidence.some(
        (p) => p.missionDate === current.missionDate,
      ),
    ).toBe(false);
    expect(report.quality.sameDay).toBe(1);
  });
  it("retains valid statistical extremes and identifies their IDs transparently", () => {
    const rows = routine();
    rows[3] = { ...rows[3], heartRate: 300 };
    const heart = forRows(rows).metrics[0];
    expect(heart.baselineCount).toBe(20);
    expect(heart.baselineEvidence.some((point) => point.value === 300)).toBe(
      true,
    );
    expect(heart.outlierIds).toContain(rows[3].id);
  });
  it("never mixes other profiles or authenticated records into demo analysis", () => {
    const rows = routine();
    const foreign = {
      ...rows[0],
      profileId: "99999999-9999-4999-8999-999999999999",
      heartRate: 320,
    };
    const cloud = { ...rows[1], source: "user-entered" as const };
    const report = forRows([...rows, foreign, cloud]);
    expect(report.quality.otherProfile).toBe(1);
    expect(report.quality.otherSource).toBe(1);
    expect(report.metrics[0].baselineCount).toBe(20);
  });
  it("keeps authenticated analysis separate from every synthetic/demo source", () => {
    const rows = routine().map((r) => ({
      ...r,
      source: "user-entered" as const,
    }));
    const report = forRows([...rows, { ...rows[0], source: "synthetic" }], {
      mode: "authenticated",
    });
    expect(report.quality.otherSource).toBe(1);
    expect(report.records.every((row) => row.source === "user-entered")).toBe(
      true,
    );
  });
  it("rejects malformed measurements and invalid timestamps rather than inventing a repair", () => {
    const rows = routine();
    const invalid = { ...rows.at(-1)!, heartRate: -20 };
    const badTime = { ...rows.at(-2)!, recordedAt: "invalid" };
    const report = forRows([
      ...rows.slice(0, -2),
      invalid,
      badTime,
    ] as HealthCheckIn[]);
    expect(report.quality.invalid).toBe(2);
    expect(report.records).toHaveLength(19);
    expect(report.stale).toBe(true);
    expect(report.observations).toEqual([]);
  });
  it("excludes future timestamps and future mission dates", () => {
    const rows = routine();
    const report = forRows([
      ...rows,
      {
        ...rows.at(-1)!,
        id: "88888888-8888-4888-8888-888888888888",
        recordedAt: "2026-12-01T10:00:00Z",
      },
    ]);
    expect(report.quality.future).toBe(1);
    expect(report.records).toHaveLength(21);
  });
  it("does not assess records with an invalid analysis clock", () => {
    const report = forRows(routine(), { asOf: "not-a-time" });
    expect(report.validClock).toBe(false);
    expect(report.observations).toEqual([]);
  });
  it("does not generate health observations with no usable evidence", () => {
    const report = analyze([]);
    expect(report.observations).toEqual([]);
    expect(report.metrics.every((m) => m.category === "insufficient")).toBe(
      true,
    );
    expect(report.quality.completeCells7).toBe(0);
    expect(report.quality.missingDays7).toBe(7);
  });
  it("reports seven-day completeness using absent days and missing cells", () => {
    const rows = routine().slice(-7);
    rows[0] = { ...rows[0], spo2: null };
    const report = forRows(rows.filter((_, i) => i !== 1));
    expect(report.quality.expectedCells7).toBe(63);
    expect(report.quality.completeCells7).toBe(53);
    expect(report.quality.missingDays7).toBe(1);
  });
  it("deduplicates identical IDs but excludes conflicting duplicates", () => {
    const rows = routine();
    const report = forRows([...rows, rows[0], { ...rows[1], heartRate: 140 }]);
    expect(report.quality.duplicate).toBe(2);
    expect(report.quality.conflicting).toBe(1);
    expect(report.records.some((r) => r.id === rows[1].id)).toBe(false);
  });
  it("does not silently reinterpret a stale record as current", () => {
    const report = forRows(routine(), { asOf: "2026-11-20T12:00:00Z" });
    expect(report.stale).toBe(true);
    expect(report.observations).toEqual([]);
    expect(report.submissionAgeHours).toBeGreaterThan(48);
    expect(report.missionAgeDays).toBe(6);
  });
  it("analyzes mood as categories, not invented numeric distances", () => {
    const report = forRows(elevatedHeart());
    const mood = report.metrics.find((m) => m.key === "mood")!;
    expect(mood.baseline).toBe("good");
    expect(mood.current!.value).toBe("stressed");
    expect(mood.percentageChange).toBeNull();
    expect(mood.rolling7).toBeNull();
    expect(mood.slope).toBeNull();
  });
});

describe("explainable patterns, scenarios and safety", () => {
  it("detects a sustained heart-rate deviation with support for each earlier comparison", () => {
    const rows = elevatedHeart();
    const heart = forRows(rows).metrics[0];
    expect(heart.category).toBe("review");
    expect(heart.repeatedDeviations).toBe(3);
    expect(heart.consecutive.direction).toBe("up");
    expect(heart.consecutive.intervals).toBeGreaterThanOrEqual(2);
  });
  it("detects sleep/fatigue co-occurrence with exact supporting values and no causal claim", () => {
    const rows = sleepFatigue();
    const report = forRows(rows);
    const pattern = report.observations.find((o) =>
      o.id.startsWith("sleep-fatigue-"),
    )!;
    expect(pattern).toBeDefined();
    expect(pattern.evidence).toHaveLength(6);
    expect(pattern.explanation).toContain("7 to 5.3 hours");
    expect(pattern.explanation).toContain("cannot establish a cause");
    expect(pattern.category).toBe("review");
    expect(pattern.evidence.every((point) => point.role === "pattern")).toBe(
      true,
    );
  });
  it("detects reduced exercise alongside increased fatigue without inferring a cause", () => {
    const rows = sleepFatigue();
    rows[18] = { ...rows[18], exercise: 70 };
    rows[19] = { ...rows[19], exercise: 50 };
    rows[20] = { ...rows[20], exercise: 30 };
    const report = forRows(rows);
    const pattern = report.observations.find((observation) =>
      observation.id.startsWith("exercise-fatigue-"),
    );
    expect(pattern?.evidence).toHaveLength(6);
    expect(pattern?.explanation).toContain("cannot establish a cause");
  });
  it("does not bridge a missing date or missing measurement for a consecutive pattern", () => {
    const rows = sleepFatigue();
    expect(
      forRows(rows.filter((_, i) => i !== 19)).observations.some((o) =>
        o.id.startsWith("sleep-fatigue-"),
      ),
    ).toBe(false);
    rows[19] = { ...rows[19], fatigue: null };
    expect(
      forRows(rows).observations.some((o) => o.id.startsWith("sleep-fatigue-")),
    ).toBe(false);
  });
  it("requires enough baseline history for a combination instead of inferring from two entries", () => {
    const rows = sleepFatigue().slice(-2);
    expect(forRows(rows).observations).toEqual([]);
  });
  it("keeps stable categories limited to statistical comparisons", () => {
    const report = forRows(routine());
    expect(report.observations.every((o) => o.category === "stable")).toBe(
      true,
    );
    expect(report.observations[0].explanation).toContain("not a diagnosis");
    expect(report.observations[0].nextStep).toContain(
      "does not rule out symptoms",
    );
  });
  it("does not generate duplicate single-indicator or contradictory observations", () => {
    const report = forRows(sleepFatigue());
    expect(new Set(report.observations.map((o) => o.id)).size).toBe(
      report.observations.length,
    );
    for (const key of report.metrics.map((m) => m.key))
      expect(
        report.observations.filter(
          (o) => o.kind === "indicator" && o.indicators.includes(key),
        ).length,
      ).toBeLessThanOrEqual(1);
  });
  it("scenario datasets are isolated, deterministic and never mutate saved rows", () => {
    const saved = routine();
    const before = JSON.stringify(saved);
    const scenario = createScenarioDataset("heart-rate", AS_OF);
    expect(JSON.stringify(saved)).toBe(before);
    expect(scenario).toEqual(createScenarioDataset("heart-rate", AS_OF));
    expect(scenario[0].profileId).not.toBe(saved[0].profileId);
    expect(scenario.every((r) => r.source === "synthetic")).toBe(true);
  });
  it("every numeric statement has evidence from the selected dataset", () => {
    const rows = elevatedHeart();
    const report = forRows(rows);
    for (const observation of report.observations)
      for (const point of observation.evidence) {
        const source = rows.find((r) => r.id === point.id)!;
        expect(source.profileId).toBe(report.profileId);
        expect(source[point.indicator]).toBe(point.value);
      }
  });
  it("uses one deterministic report for dashboard and Insights consumers", () => {
    const rows = sleepFatigue();
    const options = {
      profileId: rows[0].profileId,
      asOf: AS_OF,
      minBaseline: 5,
    };
    const report = analyzeHealthRecords(rows, options);
    expect(report.observations.slice(0, 3)).toEqual(
      analyzeHealthRecords(rows, options).observations.slice(0, 3),
    );
  });
  it("urgent reports override even statistically stable data", () => {
    const report = forRows(
      withLatest(routine(), { urgentSymptomReported: true }),
    );
    expect(report.observations).toHaveLength(1);
    expect(report.observations[0].kind).toBe("urgent");
    expect(report.observations[0].nextStep).toContain("immediate assessment");
    expect(report.observations[0].limitations.join(" ")).toContain(
      "No approved medical escalation protocol",
    );
    expect(report.observations.some((o) => o.category === "stable")).toBe(
      false,
    );
  });
  it("does not silence an urgent report when the associated reading or timestamp is invalid", () => {
    const rows = routine();
    const bad = {
      ...rows.at(-1)!,
      recordedAt: "bad",
      heartRate: -1,
      urgentSymptomReported: true,
    };
    const report = forRows([...rows.slice(0, -1), bad] as HealthCheckIn[]);
    expect(report.quality.invalid).toBe(1);
    expect(report.observations[0].kind).toBe("urgent");
  });
  it("never uses another profile's urgent flag", () => {
    const rows = routine();
    const foreign = {
      ...rows[0],
      profileId: elevatedHeart()[0].profileId,
      urgentSymptomReported: true,
    };
    expect(forRows([...rows, foreign]).urgentRecordIds).toEqual([]);
  });
  it("computes a historical timeline without look-ahead baseline data", () => {
    const rows = elevatedHeart();
    const timeline = observationTimeline(
      rows,
      { profileId: rows[0].profileId, asOf: AS_OF },
      7,
    );
    expect(timeline).toHaveLength(7);
    expect(timeline.at(-1)!.review).toBeGreaterThan(0);
    for (const frame of timeline)
      for (const id of frame.evidenceIds) {
        const row = rows.find((r) => r.id === id)!;
        expect(Date.parse(row.recordedAt)).toBeLessThanOrEqual(
          Date.parse(frame.asOf),
        );
        expect(row.missionDate <= frame.missionDate).toBe(true);
      }
  });
  it("late backdated entries do not appear in earlier timeline frames", () => {
    const rows = routine();
    const backdated = {
      ...rows[4],
      recordedAt: "2026-11-14T11:00:00Z",
      createdAt: "2026-11-14T11:00:00Z",
      updatedAt: "2026-11-14T11:00:00Z",
    };
    const records = [...rows.filter((r) => r.id !== backdated.id), backdated];
    const timeline = observationTimeline(
      records,
      { profileId: rows[0].profileId, asOf: AS_OF },
      30,
    );
    const earlier = timeline.filter((t) => t.missionDate < "2026-11-14");
    expect(earlier.every((t) => !t.evidenceIds.includes(backdated.id))).toBe(
      true,
    );
  });
  it("dedicates separate synthetic scenario urgency without changing the ordinary scenario", () => {
    const normal = createScenarioDataset("heart-rate", AS_OF);
    const urgent = createScenarioDataset("heart-rate", AS_OF, true);
    expect(normal.some((r) => r.urgentSymptomReported)).toBe(false);
    expect(forRows(urgent).observations[0].kind).toBe("urgent");
    expect(dailyRecords(normal)).toHaveLength(21);
  });
});
