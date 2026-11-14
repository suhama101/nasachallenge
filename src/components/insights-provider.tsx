"use client";
import { createContext, useContext, useMemo, useState } from "react";
import { useHealth } from "./health-provider";
import { DEMO_PROFILE_ID } from "@/lib/health/repository";
import { analyzeHealthRecords } from "@/lib/insights/analyze";
import {
  createScenarioDataset,
  scenarioDefinitions,
  type ScenarioId,
} from "@/lib/insights/scenarios";
import type { AnalysisOptions, AnalysisReport } from "@/lib/insights/types";
import type { HealthCheckIn } from "@/lib/health/validation";
type Selection = "saved" | ScenarioId;
type InsightsContextValue = {
  report: AnalysisReport | null;
  selectedRecords: HealthCheckIn[];
  options: AnalysisOptions;
  selection: Selection;
  select: (value: Selection) => void;
  minBaseline: number;
  setMinBaseline: (value: number) => void;
  scenarioUrgency: boolean;
  setScenarioUrgency: (value: boolean) => void;
};
const InsightsContext = createContext<InsightsContextValue | null>(null);
export function InsightsProvider({ children }: { children: React.ReactNode }) {
  const { records, analysisAt } = useHealth();
  const [selection, setSelection] = useState<Selection>("saved");
  const [minBaseline, setMinBaseline] = useState(5);
  const [scenarioUrgency, setScenarioUrgency] = useState(false);
  const selectedRecords = useMemo(
    () =>
      selection === "saved"
        ? records
        : createScenarioDataset(selection, analysisAt, scenarioUrgency),
    [selection, records, analysisAt, scenarioUrgency],
  );
  const profileId =
    selection === "saved"
      ? DEMO_PROFILE_ID
      : scenarioDefinitions.find((scenario) => scenario.id === selection)!
          .profileId;
  const options = useMemo<AnalysisOptions>(
    () => ({ profileId, asOf: analysisAt, mode: "demo", minBaseline }),
    [profileId, analysisAt, minBaseline],
  );
  const report = useMemo(
    () => (analysisAt ? analyzeHealthRecords(selectedRecords, options) : null),
    [selectedRecords, options, analysisAt],
  );
  const select = (value: Selection) => {
    setSelection(value);
    setScenarioUrgency(false);
  };
  return (
    <InsightsContext.Provider
      value={{
        report,
        selectedRecords,
        options,
        selection,
        select,
        minBaseline,
        setMinBaseline,
        scenarioUrgency,
        setScenarioUrgency,
      }}
    >
      {children}
    </InsightsContext.Provider>
  );
}
export function useInsights() {
  const context = useContext(InsightsContext);
  if (!context) throw new Error("InsightsProvider is missing.");
  return context;
}
