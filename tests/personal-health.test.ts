import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  HealthCheckInRow,
} from "../src/lib/health/database.types";
import { checkInInputSchema } from "../src/lib/health/validation";
import { toDatabase } from "../src/lib/health/supabase-mapping";
import { DEMO_PROFILE_ID } from "../src/lib/health/repository";
import { analyzeHealthRecords } from "../src/lib/insights/analyze";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ client: null as unknown }));
vi.mock("../src/lib/auth/server", () => ({
  authClient: async () => state.client,
}));
import {
  SupabaseHealthRepository,
  verifiedHealthContext,
} from "../src/lib/health/supabase-repository.server";
import {
  listPersonalHealth,
  mutatePersonalHealth,
} from "../src/app/astronaut/health-actions";

const ownerA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  ownerB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const profileA = "11111111-1111-4111-8111-111111111111",
  profileB = "22222222-2222-4222-8222-222222222222";
const idA = "33333333-3333-4333-8333-333333333333",
  idB = "44444444-4444-4444-8444-444444444444";
const stamp = "2026-11-14T12:00:00.000Z";
const input = () =>
  checkInInputSchema.parse({
    missionDate: "2026-11-14",
    heartRate: 72,
    systolic: 120,
    diastolic: 80,
    temperature: 36.8,
    spo2: "",
    glucose: "",
    water: "",
    sleep: 7.5,
    mood: "calm",
    fatigue: 3,
    exercise: 30,
    symptoms: [],
    notes: "Fictional unit fixture only.",
    urgentSymptomReported: false,
  });
const row = (id = idA, profileId = profileA): HealthCheckInRow => ({
  ...toDatabase(input(), id, profileId, stamp),
  created_at: stamp,
  updated_at: stamp,
});
function database(initial: HealthCheckInRow[] = [row(), row(idB, profileB)]) {
  const records = new Map(
    initial.map((value) => [value.id, structuredClone(value)]),
  );
  const calls: {
    table: string;
    operation: string;
    filters: [string, unknown][];
    body?: Record<string, unknown>;
  }[] = [];
  const settings = {
    userId: ownerA,
    verified: true,
    signedIn: true,
    profile: true,
    fail: false,
    lostInsertResponse: false,
    loseUpdateRace: false,
    leak: false,
  };
  const client = {
    auth: {
      getUser: vi.fn(async () => ({
        data: {
          user: settings.signedIn
            ? {
                id: settings.userId,
                email_confirmed_at: settings.verified ? stamp : null,
              }
            : null,
        },
        error: null,
      })),
    },
    from(table: string) {
      const call = {
        table,
        operation: "select",
        filters: [] as [string, unknown][],
        body: undefined as Record<string, unknown> | undefined,
      };
      calls.push(call);
      let lower = 0,
        upper = Infinity;
      const matching = () =>
        [...records.values()].filter((record) =>
          call.filters.every(
            ([key, value]) => record[key as keyof HealthCheckInRow] === value,
          ),
        );
      const execute = async (single = false) => {
        if (settings.fail)
          return {
            data: null,
            error: {
              code: "503",
              message: "Do not echo private provider details",
            },
          };
        if (table === "astronaut_profiles") {
          const userId = call.filters.find(([key]) => key === "user_id")?.[1];
          return {
            data: settings.profile
              ? {
                  id: userId === ownerA ? profileA : profileB,
                  user_id: userId,
                  display_name: "Fictional",
                  crew_identifier: "TEST",
                  mission_name: "Test",
                  mission_environment: "other",
                  mission_start_date: null,
                  role: null,
                  created_at: stamp,
                }
              : null,
            error: null,
          };
        }
        if (call.operation === "insert") {
          const candidate = call.body as unknown as HealthCheckInRow;
          if (records.has(candidate.id))
            return { data: null, error: { code: "23505" } };
          records.set(candidate.id, {
            ...candidate,
            created_at: stamp,
            updated_at: stamp,
          });
          if (settings.lostInsertResponse)
            return { data: null, error: { code: "503" } };
          return { data: null, error: null };
        }
        let matches = settings.leak ? [...records.values()] : matching();
        if (call.operation === "update") {
          if (settings.loseUpdateRace) matches = [];
          for (const original of matches)
            records.set(original.id, {
              ...original,
              ...call.body,
              updated_at: "2026-11-14T12:01:00.000Z",
            });
          matches = matches.map((value) => records.get(value.id)!);
        }
        if (call.operation === "delete") {
          for (const original of matches) records.delete(original.id);
        }
        const data = matches.slice(lower, upper + 1);
        return { data: single ? (data[0] ?? null) : data, error: null };
      };
      const query = {
        select() {
          return query;
        },
        eq(key: string, value: unknown) {
          call.filters.push([key, value]);
          return query;
        },
        order() {
          return query;
        },
        range(start: number, end: number) {
          lower = start;
          upper = end;
          return query;
        },
        insert(body: Record<string, unknown>) {
          call.operation = "insert";
          call.body = body;
          return query;
        },
        update(body: Record<string, unknown>) {
          call.operation = "update";
          call.body = body;
          return query;
        },
        delete() {
          call.operation = "delete";
          return query;
        },
        maybeSingle: () => execute(true),
        then(
          resolve: (value: unknown) => unknown,
          reject: (cause: unknown) => unknown,
        ) {
          return execute().then(resolve, reject);
        },
      };
      return query;
    },
  } as unknown as SupabaseClient<Database>;
  return {
    client,
    records,
    calls,
    settings,
    repository: new SupabaseHealthRepository(client, profileA),
  };
}
beforeEach(() => {
  state.client = null;
});
describe("personal repository and ownership (mocked, not live RLS)", () => {
  it("resolves the profile from verified identity, never a supplied owner", async () => {
    const db = database();
    const context = await verifiedHealthContext(db.client);
    expect(context.userId).toBe(ownerA);
    expect(context.profileId).toBe(profileA);
    expect(db.calls[0].filters).toContainEqual(["user_id", ownerA]);
  });
  it.each(["signed-out", "unverified", "no-profile"])(
    "blocks %s before health reads",
    async (scenario) => {
      const db = database();
      if (scenario === "signed-out") db.settings.signedIn = false;
      if (scenario === "unverified") db.settings.verified = false;
      if (scenario === "no-profile") db.settings.profile = false;
      await expect(verifiedHealthContext(db.client)).rejects.toThrow();
      expect(db.calls.some((call) => call.table === "health_check_ins")).toBe(
        false,
      );
    },
  );
  it("lists only owned records and rejects any misowned response", async () => {
    const db = database();
    expect((await db.repository.list()).map((value) => value.id)).toEqual([
      idA,
    ]);
    expect(db.calls.at(-1)?.filters).toContainEqual([
      "astronaut_profile_id",
      profileA,
    ]);
    db.settings.leak = true;
    await expect(db.repository.list()).rejects.toThrow();
  });
  it("paginates rather than silently truncating larger histories", async () => {
    const rows = Array.from({ length: 205 }, () => row(crypto.randomUUID()));
    const db = database(rows);
    expect(await db.repository.list()).toHaveLength(205);
    expect(db.calls).toHaveLength(2);
  });
  it("creates only user-entered data and preserves optional nulls", async () => {
    const db = database([]);
    const saved = await db.repository.save(input(), idA);
    expect(saved).toMatchObject({
      profileId: profileA,
      source: "user-entered",
      spo2: null,
      glucose: null,
      water: null,
    });
    expect(db.records.get(idA)?.astronaut_profile_id).toBe(profileA);
  });
  it("retrying after a lost insert response does not duplicate the record", async () => {
    const db = database([]);
    db.settings.lostInsertResponse = true;
    await expect(db.repository.save(input(), idA)).rejects.toThrow();
    db.settings.lostInsertResponse = false;
    expect((await db.repository.save(input(), idA)).id).toBe(idA);
    expect(db.records.size).toBe(1);
    await expect(
      db.repository.save({ ...input(), heartRate: 90 }, idA),
    ).rejects.toThrow("unavailable");
  });
  it("a conflicting ID belonging to another owner cannot be read or overwritten", async () => {
    const db = database();
    const original = structuredClone(db.records.get(idB));
    await expect(db.repository.save(input(), idB)).rejects.toThrow();
    expect(db.records.get(idB)).toEqual(original);
  });
  it.each([0, -1, 101, NaN, Infinity])(
    "rejects invalid new oxygen %s before insert",
    async (spo2) => {
      const db = database([]);
      await expect(
        db.repository.save({ ...input(), spo2 }, idA),
      ).rejects.toThrow();
      expect(db.calls).toHaveLength(0);
    },
  );
  it("edits measurements without sending immutable fields and updates only matching version/owner", async () => {
    const db = database();
    const saved = await db.repository.update(
      idA,
      { ...input(), heartRate: 79 },
      stamp,
    );
    expect(saved.heartRate).toBe(79);
    expect(saved.recordedAt).toBe(stamp);
    expect(saved.createdAt).toBe(stamp);
    const change = db.calls.find((call) => call.operation === "update")!;
    expect(change.filters).toEqual(
      expect.arrayContaining([
        ["id", idA],
        ["astronaut_profile_id", profileA],
        ["updated_at", stamp],
      ]),
    );
    for (const key of [
      "id",
      "astronaut_profile_id",
      "recorded_at",
      "created_at",
      "data_source",
    ])
      expect(change.body).not.toHaveProperty(key);
  });
  it("repeated successful edits are read-only and stale or concurrent changes are rejected", async () => {
    const db = database();
    const changed = { ...input(), heartRate: 79 };
    await db.repository.update(idA, changed, stamp);
    const writes = db.calls.filter(
      (call) => call.operation === "update",
    ).length;
    await db.repository.update(idA, changed, stamp);
    expect(db.calls.filter((call) => call.operation === "update")).toHaveLength(
      writes,
    );
    await expect(
      db.repository.update(idA, { ...changed, heartRate: 80 }, stamp),
    ).rejects.toThrow("changed");
    const race = database();
    race.settings.loseUpdateRace = true;
    await expect(race.repository.update(idA, changed, stamp)).rejects.toThrow(
      "changed",
    );
  });
  it("another owner's update/delete and stale deletes cannot mutate records", async () => {
    const db = database();
    const original = structuredClone([...db.records]);
    await expect(
      db.repository.update(idB, { ...input(), heartRate: 79 }, stamp),
    ).rejects.toThrow();
    await expect(db.repository.remove(idB, stamp)).rejects.toThrow();
    await expect(
      db.repository.remove(idA, "2026-11-13T00:00:00Z"),
    ).rejects.toThrow();
    expect([...db.records]).toEqual(original);
  });
  it("deletes one owned matching-version record only", async () => {
    const db = database();
    await db.repository.remove(idA, stamp);
    expect([...db.records.keys()]).toEqual([idB]);
  });
  it("never substitutes demo data on connection failure or accepts the demo profile", async () => {
    const db = database();
    db.settings.fail = true;
    await expect(db.repository.list()).rejects.toThrow("could not be loaded");
    expect(
      () => new SupabaseHealthRepository(db.client, DEMO_PROFILE_ID),
    ).toThrow();
  });
});
describe("personal health server actions", () => {
  it("fails closed without configuration or a current verified session", async () => {
    expect((await listPersonalHealth()).ok).toBe(false);
    const db = database();
    state.client = db.client;
    db.settings.signedIn = false;
    expect(
      await mutatePersonalHealth({
        operation: "create",
        id: idA,
        input: input(),
      }),
    ).toMatchObject({ ok: false, code: "session" });
  });
  it("ignores forged owner/source fields in form input", async () => {
    const db = database([]);
    state.client = db.client;
    const result = await mutatePersonalHealth({
      operation: "create",
      id: idA,
      input: {
        ...input(),
        profileId: profileB,
        source: "synthetic",
        userId: ownerB,
      },
    });
    expect(result).toMatchObject({
      ok: true,
      userId: ownerA,
      profileId: profileA,
    });
    expect(db.records.get(idA)).toMatchObject({
      astronaut_profile_id: profileA,
      data_source: "user-entered",
    });
  });
  it("requires explicit edit/delete confirmation and handles malformed requests", async () => {
    const db = database();
    state.client = db.client;
    for (const request of [
      {
        operation: "delete",
        id: idA,
        expectedUpdatedAt: stamp,
        confirmed: false,
      },
      {
        operation: "update",
        id: idA,
        input: input(),
        expectedUpdatedAt: stamp,
      },
      { operation: "unexpected" },
      null,
    ])
      expect((await mutatePersonalHealth(request as never)).ok).toBe(false);
    expect(db.records.size).toBe(2);
  });
  it("returns only the verified owner's history without provider error details", async () => {
    const db = database();
    state.client = db.client;
    const result = await listPersonalHealth();
    expect(result).toMatchObject({
      ok: true,
      userId: ownerA,
      profileId: profileA,
    });
    if (result.ok) expect(result.value.map((value) => value.id)).toEqual([idA]);
    db.settings.fail = true;
    const failure = await listPersonalHealth();
    expect(JSON.stringify(failure)).not.toContain("private provider details");
    expect(failure.ok).toBe(false);
  });
  it("personal analysis accepts only the owned user-entered source and keeps missing oxygen absent", async () => {
    const db = database();
    const owned = (await db.repository.list())[0];
    const report = analyzeHealthRecords(
      [
        owned,
        { ...owned, id: idB, profileId: profileB },
        { ...owned, id: crypto.randomUUID(), source: "synthetic" },
      ],
      {
        profileId: profileA,
        asOf: "2026-11-14T13:00:00Z",
        mode: "authenticated",
      },
    );
    expect(report.records).toHaveLength(1);
    expect(report.quality.otherProfile).toBe(1);
    expect(report.quality.otherSource).toBe(1);
    expect(
      report.metrics.find((metric) => metric.key === "spo2")?.current,
    ).toBeNull();
  });
});
