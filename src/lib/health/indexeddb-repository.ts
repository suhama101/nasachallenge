import {
  checkInInputSchema,
  recordSchema,
  type CheckInInput,
  type HealthCheckIn,
} from "./validation";
import { DEMO_PROFILE_ID, type DemoRepository } from "./repository";
import { createSeedRecords } from "./seed";
import { missionToday } from "./dates";
import { newestFirst } from "./selectors";

function request<T>(value: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () =>
      reject(value.error ?? new Error("Browser storage request failed."));
  });
}
function completed(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () =>
      reject(
        tx.error ?? new Error("Browser storage transaction was interrupted."),
      );
    tx.onerror = () =>
      reject(tx.error ?? new Error("Browser storage transaction failed."));
  });
}
function isLocalRecord(record: HealthCheckIn): boolean {
  return (
    record.profileId === DEMO_PROFILE_ID && record.source !== "user-entered"
  );
}

export class IndexedDbHealthRepository implements DemoRepository {
  private database: Promise<IDBDatabase> | null = null;
  constructor(
    private readonly options: {
      name?: string;
      factory?: IDBFactory;
      now?: () => Date;
    } = {},
  ) {}
  private now() {
    return this.options.now?.() ?? new Date();
  }
  private open(): Promise<IDBDatabase> {
    if (this.database) return this.database;
    this.database = new Promise<IDBDatabase>((resolve, reject) => {
      const factory = this.options.factory ?? globalThis.indexedDB;
      if (!factory) {
        reject(
          new Error(
            "IndexedDB is unavailable. Enable browser site storage to use demo mode.",
          ),
        );
        return;
      }
      const opening = factory.open(
        this.options.name ?? "missionpulse-demo-v1",
        1,
      );
      opening.onupgradeneeded = () => {
        const db = opening.result;
        const store = db.createObjectStore("checkIns", { keyPath: "id" });
        store.createIndex("recordedAt", "recordedAt");
        store.createIndex("missionDate", "missionDate");
        db.createObjectStore("metadata", { keyPath: "key" });
      };
      opening.onerror = () =>
        reject(
          new Error(
            "Could not open demo storage. Check browser storage permissions.",
          ),
        );
      opening.onblocked = () =>
        reject(
          new Error(
            "Another tab is blocking demo storage. Close it and retry.",
          ),
        );
      opening.onsuccess = () => {
        const db = opening.result;
        db.onversionchange = () => {
          db.close();
          this.database = null;
        };
        resolve(db);
      };
    }).catch((error) => {
      this.database = null;
      throw error;
    });
    return this.database;
  }
  private async initialized(): Promise<IDBDatabase> {
    const db = await this.open();
    // One transaction owns both marker and seeds, including concurrent tabs/Strict Mode.
    const tx = db.transaction(["metadata", "checkIns"], "readwrite");
    const done = completed(tx);
    try {
      const metadata = tx.objectStore("metadata");
      const existing = await request(metadata.get("initialized"));
      if (!existing) {
        const anchorDate = missionToday(this.now());
        const store = tx.objectStore("checkIns");
        createSeedRecords(anchorDate).forEach((row) => store.add(row));
        metadata.put({ key: "initialized", seedAnchorDate: anchorDate });
      }
      await done;
      return db;
    } catch (error) {
      await done.catch(() => {});
      throw error;
    }
  }
  async list(): Promise<HealthCheckIn[]> {
    const db = await this.initialized();
    const tx = db.transaction("checkIns", "readonly");
    const done = completed(tx);
    try {
      const rows = await request(tx.objectStore("checkIns").getAll());
      await done;
      const parsed = rows.map((row) => recordSchema.parse(row));
      if (parsed.some((row) => !isLocalRecord(row)))
        throw new Error("Unexpected non-demo data in local storage.");
      return newestFirst(parsed);
    } catch (error) {
      await done.catch(() => {});
      throw error;
    }
  }
  async save(
    input: CheckInInput,
    submissionId: string,
  ): Promise<HealthCheckIn> {
    const parsed = checkInInputSchema.parse(input); // Validate before touching persistence.
    const timestamp = this.now().toISOString();
    const candidate = recordSchema.parse({
      ...parsed,
      id: submissionId,
      profileId: DEMO_PROFILE_ID,
      source: "user-entered-demo",
      recordedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const db = await this.initialized();
    const tx = db.transaction("checkIns", "readwrite");
    const done = completed(tx);
    try {
      const store = tx.objectStore("checkIns");
      const existing = await request(store.get(candidate.id));
      if (existing) {
        const row = recordSchema.parse(existing);
        if (!isLocalRecord(row)) throw new Error("Invalid demo record owner.");
        const keys = Object.keys(parsed) as (keyof CheckInInput)[];
        if (
          keys.some(
            (key) => JSON.stringify(row[key]) !== JSON.stringify(parsed[key]),
          )
        )
          throw new Error(
            "This submission ID was already used for different values. Start a new check-in.",
          );
        await done;
        return row;
      }
      await request(store.add(candidate));
      await done;
      return candidate;
    } catch (error) {
      await done.catch(() => {});
      throw error;
    }
  }
  async reset(): Promise<void> {
    const db = await this.initialized();
    const tx = db.transaction("checkIns", "readwrite");
    const done = completed(tx);
    try {
      await request(tx.objectStore("checkIns").clear());
      await done;
    } catch (error) {
      await done.catch(() => {});
      throw error;
    }
    // Keep the initialization marker: an intentionally empty database stays empty on refresh.
  }
  async close(): Promise<void> {
    const db = await this.database;
    db?.close();
    this.database = null;
  }
}
