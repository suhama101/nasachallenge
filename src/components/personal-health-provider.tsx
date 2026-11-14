"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  listPersonalHealth,
  mutatePersonalHealth,
} from "@/app/astronaut/health-actions";
import type { PersonalResult } from "@/lib/health/personal-types";
import type { CheckInInput, HealthCheckIn } from "@/lib/health/validation";
import { newestFirst } from "@/lib/health/selectors";
import { missionToday } from "@/lib/health/dates";

type PersonalHealth = {
  records: HealthCheckIn[];
  loading: boolean;
  error: string | null;
  today: string;
  asOf: string;
  refresh: () => Promise<void>;
  save: (input: CheckInInput, id: string) => Promise<HealthCheckIn>;
  update: (
    record: HealthCheckIn,
    input: CheckInInput,
  ) => Promise<HealthCheckIn>;
  remove: (record: HealthCheckIn) => Promise<void>;
};
const Context = createContext<PersonalHealth | null>(null);
export function PersonalHealthProvider({
  userId,
  profileId,
  children,
}: {
  userId: string;
  profileId: string;
  children: React.ReactNode;
}) {
  const [records, setRecords] = useState<HealthCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asOf, setAsOf] = useState("");
  const active = useRef(false),
    sequence = useRef(0),
    channel = useRef<BroadcastChannel | null>(null);
  const unwrap = useCallback(
    <T,>(result: PersonalResult<T>): T => {
      if (!active.current) throw new Error("Workspace closed.");
      if (!result.ok) {
        if (result.code === "session" || result.code === "onboarding") {
          setRecords([]);
          window.location.replace(
            result.code === "session"
              ? "/auth/login?reason=session"
              : "/astronaut/onboarding",
          );
        }
        throw new Error(result.message);
      }
      if (result.userId !== userId || result.profileId !== profileId) {
        setRecords([]);
        window.location.replace("/auth/login?reason=session");
        throw new Error("The signed-in account has changed.");
      }
      return result.value;
    },
    [userId, profileId],
  );
  const refresh = useCallback(async () => {
    const request = ++sequence.current;
    try {
      const result = await listPersonalHealth();
      if (!active.current || request !== sequence.current) return;
      const rows = unwrap(result);
      if (
        rows.some(
          (row) => row.profileId !== profileId || row.source !== "user-entered",
        )
      )
        throw new Error("History ownership could not be verified.");
      setRecords(newestFirst(rows));
      setAsOf(new Date().toISOString());
      setError(null);
    } catch (cause) {
      if (active.current && request === sequence.current) {
        setRecords([]);
        setError(
          cause instanceof Error
            ? cause.message
            : "Your health history could not be loaded. Please try again.",
        );
      }
    } finally {
      if (active.current && request === sequence.current) {
        setAsOf(new Date().toISOString());
        setLoading(false);
      }
    }
  }, [unwrap, profileId]);
  useEffect(() => {
    const requests = sequence;
    active.current = true;
    const initialRead = window.setTimeout(() => void refresh(), 0);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(
      () => setAsOf(new Date().toISOString()),
      60_000,
    );
    if (typeof BroadcastChannel !== "undefined") {
      const value = new BroadcastChannel(
        "missionpulse-personal-health-updates",
      );
      value.onmessage = onFocus;
      channel.current = value;
    }
    return () => {
      active.current = false;
      ++requests.current;
      window.clearTimeout(initialRead);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
      channel.current?.close();
      channel.current = null;
    };
  }, [refresh]);
  const acceptRecord = (record: HealthCheckIn | null) => {
    if (
      !record ||
      record.profileId !== profileId ||
      record.source !== "user-entered"
    )
      throw new Error("Could not confirm your saved check-in.");
    ++sequence.current;
    setRecords((current) =>
      newestFirst([...current.filter((row) => row.id !== record.id), record]),
    );
    setAsOf(new Date().toISOString());
    channel.current?.postMessage("changed");
    return record;
  };
  return (
    <Context.Provider
      value={{
        records,
        loading,
        error,
        asOf,
        today: asOf ? missionToday(new Date(asOf)) : "",
        refresh,
        save: async (input, id) =>
          acceptRecord(
            unwrap(
              await mutatePersonalHealth({ operation: "create", id, input }),
            ),
          ),
        update: async (record, input) =>
          acceptRecord(
            unwrap(
              await mutatePersonalHealth({
                operation: "update",
                id: record.id,
                input,
                expectedUpdatedAt: record.updatedAt,
                confirmed: true,
              }),
            ),
          ),
        remove: async (record) => {
          unwrap(
            await mutatePersonalHealth({
              operation: "delete",
              id: record.id,
              expectedUpdatedAt: record.updatedAt,
              confirmed: true,
            }),
          );
          ++sequence.current;
          setRecords((current) =>
            current.filter((row) => row.id !== record.id),
          );
          setAsOf(new Date().toISOString());
          channel.current?.postMessage("changed");
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function usePersonalHealth() {
  const value = useContext(Context);
  if (!value) throw new Error("Personal workspace missing.");
  return value;
}
