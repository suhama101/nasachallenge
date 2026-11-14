import { describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { checkInInputSchema, recordSchema } from "../src/lib/health/validation";
import { IndexedDbHealthRepository } from "../src/lib/health/indexeddb-repository";
import { DEMO_PROFILE_ID } from "../src/lib/health/repository";
import {
  average,
  hasCompleteCheckInForDate,
} from "../src/lib/health/selectors";
import {
  recordCoverage,
  spo2Label,
  usableSpo2,
} from "../src/lib/health/integrity";
import { createScenarioDataset } from "../src/lib/insights/scenarios";
import {
  analyzeHealthRecords,
  observationTimeline,
} from "../src/lib/insights/analyze";
import { answerLocally } from "../src/lib/assistant/answers";
import { toDatabase } from "../src/lib/health/supabase-mapping";
const asOf = "2026-11-14T12:00:00.000Z";
const form = {
  missionDate: "2026-11-14",
  heartRate: "92",
  sleep: "4.5",
  temperature: "36.8",
  systolic: "118",
  diastolic: "76",
  fatigue: "7",
  exercise: "45",
  mood: "neutral",
  spo2: "98",
  glucose: "",
  water: "",
  symptoms: [],
  notes: "Fictional integrity regression fixture",
};
const history = () =>
  createScenarioDataset("routine", asOf).map((row) => ({
    ...row,
    profileId: DEMO_PROFILE_ID,
  }));
describe("SpO2 write contract and absence", () => {
  it.each([1, 65, 98, 98.5, 100])(
    "accepts and preserves explicit %s percent without inventing a replacement",
    (spo2) => {
      expect(checkInInputSchema.parse({ ...form, spo2 }).spo2).toBe(spo2);
    },
  );
  it.each(["", "  ", undefined, null])(
    "stores optional blank %j as null, never zero",
    (spo2) => {
      const value = checkInInputSchema.parse({ ...form, spo2 });
      expect(value.spo2).toBeNull();
      expect(JSON.parse(JSON.stringify(value)).spo2).toBeNull();
    },
  );
  it("allows the optional field to be omitted entirely", () => {
    const { spo2, ...value } = form;
    expect(spo2).toBe("98");
    expect(checkInInputSchema.parse(value).spo2).toBeNull();
  });
  it.each([0, "0", 0.5, -1, 101, "abc", NaN, Infinity])(
    "rejects invalid new reading %j",
    (spo2) => {
      const parsed = checkInInputSchema.safeParse({ ...form, spo2 });
      expect(parsed.success).toBe(false);
      if (!parsed.success)
        expect(
          parsed.error.issues.some((issue) => issue.path[0] === "spo2"),
        ).toBe(true);
    },
  );
  it("retains meaningful zero sleep/water/fatigue/exercise while treating absent oxygen as absent", () => {
    expect(
      checkInInputSchema.parse({
        ...form,
        spo2: "",
        sleep: 0,
        water: 0,
        fatigue: 0,
        exercise: 0,
      }),
    ).toMatchObject({
      spo2: null,
      sleep: 0,
      water: 0,
      fatigue: 0,
      exercise: 0,
    });
  });
  it("maps missing SpO2 to a nullable future database field without connecting Supabase", () => {
    const value = checkInInputSchema.parse({ ...form, spo2: "" });
    const row = toDatabase(
      value,
      crypto.randomUUID(),
      "50000000-0000-4000-8000-000000000001",
      asOf,
    );
    expect(row.spo2).toBeNull();
  });
});
describe("persistent storage and legacy review", () => {
  it("represents an omitted legacy oxygen property as absent without inventing zero", () => {
    const row = history()[0];
    const { spo2, ...legacy } = row;
    expect(spo2).toBeGreaterThan(0);
    expect(recordSchema.parse(legacy).spo2).toBeNull();
    expect(Object.hasOwn(legacy, "spo2")).toBe(false);
  });
  it("saves null idempotently and restores it after reopening without reseeding deleted demo data", async () => {
    const factory = new IDBFactory();
    const name = crypto.randomUUID();
    const options = { name, factory, now: () => new Date(asOf) };
    let repository = new IndexedDbHealthRepository(options);
    await repository.reset();
    const input = checkInInputSchema.parse({ ...form, spo2: "" });
    const id = crypto.randomUUID();
    await repository.save(input, id);
    await repository.save(input, id);
    await repository.close();
    repository = new IndexedDbHealthRepository(options);
    expect(await repository.list()).toHaveLength(1);
    expect((await repository.list())[0].spo2).toBeNull();
    expect(
      hasCompleteCheckInForDate(await repository.list(), "2026-11-14"),
    ).toBe(true);
    await repository.close();
  });
  it("blocks zero before persisting and preserves existing records", async () => {
    const repository = new IndexedDbHealthRepository({
      factory: new IDBFactory(),
      now: () => new Date(asOf),
    });
    const before = await repository.list();
    await expect(
      repository.save(
        { ...checkInInputSchema.parse(form), spo2: 0 },
        crypto.randomUUID(),
      ),
    ).rejects.toThrow();
    expect(await repository.list()).toEqual(before);
    await repository.close();
  });
  it("reads an existing stored zero unchanged and never writes an automatic repair", async () => {
    const factory = new IDBFactory();
    const name = crypto.randomUUID();
    let repository = new IndexedDbHealthRepository({
      factory,
      name,
      now: () => new Date(asOf),
    });
    const saved = await repository.save(
      checkInInputSchema.parse(form),
      crypto.randomUUID(),
    );
    await repository.close();
    const legacy = { ...saved, spo2: 0 };
    await new Promise<void>((resolve, reject) => {
      const open = factory.open(name, 1);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction("checkIns", "readwrite");
        tx.objectStore("checkIns").put(legacy);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(Error("fixture write failed"));
      };
    });
    repository = new IndexedDbHealthRepository({
      factory,
      name,
      now: () => new Date(asOf),
    });
    expect(
      (await repository.list()).find((row) => row.id === legacy.id),
    ).toEqual(legacy);
    await repository.close();
  });
});
describe("consistent calculation/display rules", () => {
  it("distinguishes missing from a flagged original zero", () => {
    expect(spo2Label(null)).toBe("Not recorded");
    expect(spo2Label(0)).toContain("0 % — Needs review");
    expect(usableSpo2(0)).toBeNull();
    expect(usableSpo2(0.5)).toBeNull();
    expect(spo2Label(0.5)).toContain("0.5 % — Needs review");
    expect(spo2Label(98)).toBe("98 %");
  });
  it("excludes legacy zeros from averages while retaining valid zeros for other indicators", () => {
    const row = history()[0];
    expect(
      average(
        [
          { ...row, spo2: 0 },
          { ...row, spo2: null },
          { ...row, spo2: 98 },
        ],
        "spo2",
      ),
    ).toBe("98.0");
    expect(average([{ ...row, spo2: 0 }], "spo2")).toBeNull();
    expect(average([{ ...row, sleep: 0 }], "sleep")).toBe("0.0");
    expect(recordCoverage({ ...row, spo2: 0 })).toEqual({
      recorded: 8,
      missing: 2,
      review: 1,
    });
  });
  it("keeps original records, excludes only uncertain oxygen evidence and still analyzes other indicators", () => {
    const rows = history();
    rows[0].spo2 = 0;
    rows[20].spo2 = 0;
    rows[20].heartRate = 92;
    const original = structuredClone(rows);
    const report = analyzeHealthRecords(rows, {
      profileId: DEMO_PROFILE_ID,
      asOf,
      mode: "demo",
    });
    const oxygen = report.metrics.find((metric) => metric.key === "spo2")!;
    expect(oxygen.current).toBeNull();
    expect(oxygen.baselineCount).toBe(19);
    expect(oxygen.rolling7Count).toBe(6);
    expect(oxygen.baselineEvidence.every((point) => point.value !== 0)).toBe(
      true,
    );
    expect(
      report.metrics.find((metric) => metric.key === "heartRate")!.current!
        .value,
    ).toBe(92);
    expect(report.current!.spo2).toBe(0);
    expect(report.records[0].spo2).toBe(0);
    expect(report.limitations.join(" ")).toContain("needs review");
    expect(rows).toEqual(original);
  });
  it("does not backfill a missing current oxygen value from an earlier one", () => {
    const rows = history();
    rows[20].spo2 = null;
    const report = analyzeHealthRecords(rows, {
      profileId: DEMO_PROFILE_ID,
      asOf,
      mode: "demo",
    });
    expect(
      report.metrics.find((metric) => metric.key === "spo2")!.current,
    ).toBeNull();
  });
  it("keeps uncertain oxygen out of historical timelines and assistant arithmetic", () => {
    const rows = history();
    rows[20].spo2 = 0;
    const answer = answerLocally({
      question:
        "How has my oxygen saturation changed over the last seven days?",
      dataset: "saved",
      records: rows,
      asOf,
      minBaseline: 5,
      useRecords: true,
    });
    expect(
      answer.sections.some((section) => section.id === "spo2-review"),
    ).toBe(true);
    const recorded = answer.sections.find(
      (section) => section.id === "recorded-spo2",
    )!;
    expect(recorded.text).toContain("0 % — Needs review");
    expect(recorded.text).toContain("(n=6)");
    expect(recorded.text).not.toContain("Arithmetic mean: 0");
    expect(
      observationTimeline(
        rows,
        { profileId: DEMO_PROFILE_ID, asOf, mode: "demo" },
        7,
      )
        .at(-1)!
        .titles.some((title) => title.startsWith("SpO₂:")),
    ).toBe(false);
  });
  it("preserves urgency even when the oxygen value needs review", () => {
    const rows = history();
    rows[20].spo2 = 0;
    rows[20].urgentSymptomReported = true;
    const report = analyzeHealthRecords(rows, {
      profileId: DEMO_PROFILE_ID,
      asOf,
      mode: "demo",
    });
    expect(report.observations).toHaveLength(1);
    expect(report.observations[0].kind).toBe("urgent");
    expect(recordSchema.parse(rows[20]).spo2).toBe(0);
  });
});
