"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { IndexedDbHealthRepository } from "@/lib/health/indexeddb-repository";
import { missionToday } from "@/lib/health/dates";
import type { CheckInInput, HealthCheckIn } from "@/lib/health/validation";

type HealthContextValue = {
  records: HealthCheckIn[];
  loading: boolean;
  error: string | null;
  today: string;
  refresh: () => Promise<void>;
  save: (input: CheckInInput, id: string) => Promise<HealthCheckIn>;
  reset: () => Promise<void>;
};
const HealthContext = createContext<HealthContextValue | null>(null);
export function HealthProvider({ children }: { children: React.ReactNode }) {
  const [repository] = useState(() => new IndexedDbHealthRepository());
  const [records, setRecords] = useState<HealthCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState("");
  const sequence = useRef(0);
  const channel = useRef<BroadcastChannel | null>(null);
  const refresh = useCallback(() => {
    const request = ++sequence.current;
    return repository
      .list()
      .then((rows) => {
        if (request === sequence.current) {
          setRecords(rows);
          setToday(missionToday());
          setError(null);
        }
      })
      .catch(() => {
        if (request === sequence.current)
          setError(
            "Demo storage could not be loaded. Enable site storage, check available space, then retry. Your entries are not sent to a server.",
          );
      })
      .finally(() => {
        if (request === sequence.current) setLoading(false);
      });
  }, [repository]);
  useEffect(() => {
    const requests = sequence;
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(() => setToday(missionToday()), 60_000);
    if (typeof BroadcastChannel !== "undefined") {
      const value = new BroadcastChannel("missionpulse-demo-updates");
      value.onmessage = onFocus;
      channel.current = value;
    }
    return () => {
      ++requests.current;
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
      channel.current?.close();
      channel.current = null;
    };
  }, [refresh]);
  const save = async (input: CheckInInput, id: string) => {
    const row = await repository.save(input, id);
    await refresh();
    channel.current?.postMessage("changed");
    return row;
  };
  const reset = async () => {
    await repository.reset();
    await refresh();
    channel.current?.postMessage("changed");
  };
  return (
    <HealthContext.Provider
      value={{ records, loading, error, today, refresh, save, reset }}
    >
      {children}
    </HealthContext.Provider>
  );
}
export function useHealth() {
  const value = useContext(HealthContext);
  if (!value) throw new Error("HealthProvider is missing.");
  return value;
}
