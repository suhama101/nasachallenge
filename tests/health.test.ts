import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { readFileSync } from "node:fs";
import { IndexedDbHealthRepository } from "../src/lib/health/indexeddb-repository";
import {
  checkInInputSchema,
  isMissionDate,
  recordSchema,
} from "../src/lib/health/validation";
import {
  average,
  chartRecords,
  filterRecords,
  hasCompleteCheckInForDate,
  latestRecord,
  measurement,
} from "../src/lib/health/selectors";
import { missionToday, displayDate } from "../src/lib/health/dates";
import { DEMO_PROFILE_ID } from "../src/lib/health/repository";
import {
  assertAuthenticatedRecord,
  fromDatabase,
  toDatabase,
} from "../src/lib/health/supabase-mapping";

const valid = {
  missionDate: "2026-11-14",
  heartRate: "72",
  systolic: "120",
  diastolic: "80",
  temperature: "36.7",
  spo2: "98",
  glucose: "",
  sleep: "7.5",
  mood: "calm",
  fatigue: "3",
  exercise: "45",
  water: "",
  symptoms: ["Headache"],
  notes: "Fictional test check-in",
};
const input = () => checkInInputSchema.parse(valid);
describe("form and domain validation", () => {
  it("loads Phase 2 records without an urgent flag as not explicitly reported", () => {
    const legacy = {
      id: crypto.randomUUID(),
      profileId: DEMO_PROFILE_ID,
      recordedAt: "2026-11-14T10:00:00Z",
      createdAt: "2026-11-14T10:00:00Z",
      updatedAt: "2026-11-14T10:00:00Z",
      source: "synthetic",
      ...input(),
    };
    delete (legacy as Partial<typeof legacy>).urgentSymptomReported;
    expect(recordSchema.parse(legacy).urgentSymptomReported).toBe(false);
  });
  it("parses form numbers and preserves missing optionals without inventing zeros", () => {
    expect(input()).toMatchObject({
      heartRate: 72,
      glucose: null,
      water: null,
      fatigue: 3,
    });
  });
  it.each([
    "heartRate",
    "systolic",
    "diastolic",
    "temperature",
    "sleep",
    "mood",
    "fatigue",
    "exercise",
    "missionDate",
  ])("requires %s", (field) => {
    expect(
      checkInInputSchema.safeParse({ ...valid, [field]: "" }).success,
    ).toBe(false);
  });
  it.each([
    { heartRate: -1 },
    { spo2: 101 },
    { sleep: 25 },
    { fatigue: 11 },
    { exercise: 1441 },
    { temperature: 80 },
    { glucose: -1 },
    { water: -2 },
    { heartRate: Infinity },
    { heartRate: "abc" },
    { diastolic: 121 },
    { heartRate: 70.5 },
    { symptoms: ["Unknown symptom"] },
    { notes: "x".repeat(2001) },
  ])("rejects impossible or malformed entries %j", (patch) => {
    expect(checkInInputSchema.safeParse({ ...valid, ...patch }).success).toBe(
      false,
    );
  });
  it("accepts unusual values instead of applying typical clinical ranges", () => {
    expect(
      checkInInputSchema.safeParse({
        ...valid,
        heartRate: 230,
        systolic: 250,
        diastolic: 140,
        temperature: 40.8,
        spo2: 65,
        glucose: 600,
        sleep: 0,
        fatigue: 10,
      }).success,
    ).toBe(true);
  });
  it("preserves optional zero water and zero sleep rather than treating them as missing", () => {
    expect(
      checkInInputSchema.parse({ ...valid, water: 0, sleep: 0 }),
    ).toMatchObject({ water: 0, sleep: 0 });
  });
  it("rejects rolled-over calendar dates and preserves leap dates", () => {
    expect(isMissionDate("2026-02-30")).toBe(false);
    expect(isMissionDate("2028-02-29")).toBe(true);
    expect(isMissionDate("0000-01-01")).toBe(false);
    expect(isMissionDate("2026-1-1")).toBe(false);
  });
  it("defines the mission calendar as UTC, independent of device offsets", () => {
    expect(missionToday(new Date("2026-11-15T01:00:00+05:00"))).toBe(
      "2026-11-14",
    );
    expect(displayDate("2026-11-14")).toBe("14 Nov 2026");
  });
});

describe("real IndexedDB repository behavior", () => {
  let factory: IDBFactory;
  let repository: IndexedDbHealthRepository;
  const now = () => new Date("2026-11-14T10:00:00Z");
  beforeEach(() => {
    factory = new IDBFactory();
    repository = new IndexedDbHealthRepository({ factory, now });
  });
  afterEach(async () => {
    await repository.close();
  });
  it("atomically seeds once under concurrent initialization", async () => {
    const [first, second] = await Promise.all([
      repository.list(),
      repository.list(),
    ]);
    expect(first).toHaveLength(14);
    expect(second).toHaveLength(14);
    expect(
      first.every(
        (r) => r.source === "synthetic" && r.profileId === DEMO_PROFILE_ID,
      ),
    ).toBe(true);
  });
  it("saves validated records with separate selected date and submission timestamp", async () => {
    const row = await repository.save(
      { ...input(), missionDate: "2026-11-10" },
      crypto.randomUUID(),
    );
    expect(row.missionDate).toBe("2026-11-10");
    expect(row.recordedAt).toBe("2026-11-14T10:00:00.000Z");
    expect(row.source).toBe("user-entered-demo");
    expect((await repository.list())[0].id).toBe(row.id);
  });
  it("rejects invalid records before writing", async () => {
    await expect(
      repository.save({ ...input(), heartRate: -1 }, crypto.randomUUID()),
    ).rejects.toThrow();
    expect(await repository.list()).toHaveLength(14);
  });
  it("loads saved entries through a new repository instance after refresh", async () => {
    const saved = await repository.save(input(), crypto.randomUUID());
    await repository.close();
    repository = new IndexedDbHealthRepository({
      factory,
      now: () => new Date("2026-12-01T08:00:00Z"),
    });
    const rows = await repository.list();
    expect(rows).toHaveLength(15);
    expect(rows.find((r) => r.id === saved.id)).toEqual(saved);
    expect(rows.filter((r) => r.source === "synthetic")[0].missionDate).toBe(
      "2026-11-13",
    );
  });
  it("prevents simultaneous duplicate submission IDs, including a second tab", async () => {
    const id = crypto.randomUUID();
    const other = new IndexedDbHealthRepository({ factory, now });
    try {
      const [a, b] = await Promise.all([
        repository.save(input(), id),
        other.save(input(), id),
      ]);
      expect(a).toEqual(b);
      expect(await repository.list()).toHaveLength(15);
    } finally {
      await other.close();
    }
  });
  it("rejects reuse of an idempotency ID with different values", async () => {
    const id = crypto.randomUUID();
    await repository.save(input(), id);
    await expect(
      repository.save({ ...input(), heartRate: 75 }, id),
    ).rejects.toThrow(/different values/);
    expect((await repository.list())[0].heartRate).toBe(72);
  });
  it("permits intentional distinct check-ins for the same mission date", async () => {
    await repository.save(input(), crypto.randomUUID());
    await repository.save(
      { ...input(), notes: "Second deliberate check-in" },
      crypto.randomUUID(),
    );
    expect(
      (await repository.list()).filter((r) => r.source === "user-entered-demo"),
    ).toHaveLength(2);
  });
  it("uses the newest submission for dashboard metrics, even for a backdated mission date", async () => {
    const row = await repository.save(
      {
        ...input(),
        missionDate: "2026-11-01",
        heartRate: 85,
        sleep: 6,
        spo2: 96,
        temperature: 37.1,
      },
      crypto.randomUUID(),
    );
    expect(latestRecord(await repository.list())).toEqual(row);
  });
  it("keeps chronological ordering and filters selected mission dates inclusively", async () => {
    await repository.save(input(), crypto.randomUUID());
    const rows = await repository.list();
    expect(rows[0].source).toBe("user-entered-demo");
    expect(filterRecords(rows, "2026-11-12", "2026-11-13")).toHaveLength(2);
    expect(chartRecords(rows)[0].missionDate).toBe("2026-10-31");
  });
  it("resets both seeded and user entries without reseeding on refresh", async () => {
    await repository.save(input(), crypto.randomUUID());
    await repository.reset();
    expect(await repository.list()).toEqual([]);
    await repository.close();
    repository = new IndexedDbHealthRepository({ factory, now });
    expect(await repository.list()).toEqual([]);
    expect(latestRecord(await repository.list())).toBeNull();
    await repository.save(input(), crypto.randomUUID());
    expect(await repository.list()).toHaveLength(1);
  });
  it("preserves missing readings, excludes them from means and does not backfill latest metrics", async () => {
    const row = await repository.save(input(), crypto.randomUUID());
    const missing = recordSchema.parse({
      ...row,
      id: crypto.randomUUID(),
      recordedAt: "2026-11-14T11:00:00Z",
      heartRate: null,
      spo2: null,
    });
    expect(latestRecord([row, missing])?.heartRate).toBeNull();
    expect(average([row, missing], "heartRate")).toBe("72.0");
    expect(average([missing], "heartRate")).toBeNull();
    expect(measurement(missing.spo2, "%")).toBe("Not recorded");
    expect(measurement(0, "hours")).toBe("0 hours");
  });
  it("counts only complete non-synthetic records for today's check-in", async () => {
    const row = await repository.save(input(), crypto.randomUUID());
    expect(
      hasCompleteCheckInForDate(
        [{ ...row, source: "synthetic" }],
        row.missionDate,
      ),
    ).toBe(false);
    expect(
      hasCompleteCheckInForDate([{ ...row, heartRate: null }], row.missionDate),
    ).toBe(false);
    expect(hasCompleteCheckInForDate([row], row.missionDate)).toBe(true);
    expect(hasCompleteCheckInForDate([row], "2026-11-15")).toBe(false);
  });
  it("reports unavailable IndexedDB instead of silently switching to volatile storage", async () => {
    const unavailable = new IndexedDbHealthRepository();
    await expect(unavailable.list()).rejects.toThrow(
      /IndexedDB is unavailable/,
    );
  });
  it("reports corrupt stored records without overwriting them with seeds", async () => {
    await repository.list();
    const opening = factory.open("missionpulse-demo-v1", 1);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      opening.onsuccess = () => resolve(opening.result);
      opening.onerror = () => reject(opening.error);
    });
    const tx = db.transaction("checkIns", "readwrite");
    tx.objectStore("checkIns").put({
      id: crypto.randomUUID(),
      heartRate: "corrupt",
    });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    await expect(repository.list()).rejects.toThrow();
    await repository.reset();
    expect(await repository.list()).toEqual([]);
  });
});

describe("authenticated Supabase adapter boundaries", () => {
  const profileId = "11111111-1111-4111-8111-111111111111";
  const stamp = "2026-11-14T10:00:00.000Z";
  it("maps validated fields and keeps optional nulls", () => {
    const row = toDatabase(input(), crypto.randomUUID(), profileId, stamp);
    const record = fromDatabase(
      { ...row, created_at: stamp, updated_at: stamp },
      profileId,
    );
    expect(record).toMatchObject({
      ...input(),
      source: "user-entered",
      profileId,
      glucose: null,
      water: null,
    });
  });
  it("rejects the fictional demo profile in the authenticated write path", () => {
    expect(() =>
      toDatabase(input(), crypto.randomUUID(), DEMO_PROFILE_ID, stamp),
    ).toThrow(/Demo records/);
  });
  it("rejects a returned row owned by another profile", () => {
    const row = toDatabase(input(), crypto.randomUUID(), profileId, stamp);
    expect(() =>
      fromDatabase(
        { ...row, created_at: stamp, updated_at: stamp },
        "22222222-2222-4222-8222-222222222222",
      ),
    ).toThrow();
  });
  it("rejects synthetic/demo records at the authenticated storage boundary", () => {
    const row = toDatabase(input(), crypto.randomUUID(), profileId, stamp);
    const record = fromDatabase(
      { ...row, created_at: stamp, updated_at: stamp },
      profileId,
    );
    expect(() =>
      assertAuthenticatedRecord({ ...record, source: "synthetic" }, profileId),
    ).toThrow();
    expect(() =>
      assertAuthenticatedRecord(
        { ...record, source: "user-entered-demo" },
        profileId,
      ),
    ).toThrow();
  });
  it("keeps RLS enabled, anon unprivileged and insert/update ownership checks in the migration", () => {
    const sql = readFileSync(
      new URL(
        "../supabase/migrations/202611140001_health_records.sql",
        import.meta.url,
      ),
      "utf8",
    );
    expect(sql).toContain(
      "alter table public.astronaut_profiles enable row level security",
    );
    expect(sql).toContain(
      "alter table public.health_check_ins enable row level security",
    );
    expect(sql).toContain("from anon, authenticated");
    expect(sql).toContain("data_source = 'user-entered'");
    expect(sql).toMatch(/check_in_update_owner[\s\S]*with check/);
    expect(sql).not.toMatch(/to anon using/);
  });
});
