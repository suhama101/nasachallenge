"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, History } from "lucide-react";
import { useHealth } from "./health-provider";
import { ResetDemoData } from "./demo-status";
import { HealthCharts } from "./health-charts";
import { LatestMeasurements } from "./metric-card";
import { Button } from "./ui/button";
import {
  filterRecords,
  latestRecord,
  measurement,
  sourceLabel,
} from "@/lib/health/selectors";
import { displayDate, displayTimestamp } from "@/lib/health/dates";
import { isMissionDate, type HealthCheckIn } from "@/lib/health/validation";

export function CheckInDetails({ record }: { record: HealthCheckIn }) {
  const values = [
    ["Resting heart rate", measurement(record.heartRate, "bpm")],
    ["Systolic pressure", measurement(record.systolic, "mmHg")],
    ["Diastolic pressure", measurement(record.diastolic, "mmHg")],
    ["Body temperature", measurement(record.temperature, "°C")],
    ["SpO₂", measurement(record.spo2, "%")],
    ["Blood glucose", measurement(record.glucose, "mg/dL")],
    ["Sleep", measurement(record.sleep, "hours")],
    ["Mood", record.mood ?? "Not recorded"],
    ["Fatigue", measurement(record.fatigue, "/ 10")],
    ["Exercise", measurement(record.exercise, "minutes")],
    ["Water", measurement(record.water, "liters")],
  ];
  return (
    <details className="panel checkin-details">
      <summary>
        <span className="record-icon">
          <History size={18} />
        </span>
        <span>
          <strong>{displayDate(record.missionDate)}</strong>
          <small>
            Mission date (UTC) · Recorded {displayTimestamp(record.recordedAt)}
          </small>
        </span>
        <span className="source-tag">{sourceLabel(record.source)}</span>
        <span className="detail-hint">View details</span>
      </summary>
      <div className="checkin-detail-body">
        <dl className="record-values">
          {values.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <dl className="record-notes">
          <div>
            <dt>Symptoms selected</dt>
            <dd>
              {record.symptoms.length
                ? record.symptoms.join(", ")
                : "None selected"}
            </dd>
          </div>
          <div>
            <dt>Notes</dt>
            <dd>{record.notes || "Not recorded"}</dd>
          </div>
          <div>
            <dt>Data provenance</dt>
            <dd>
              {sourceLabel(record.source)} · Fictional profile AST-0042 · Not
              automatically measured by a medical device.
            </dd>
          </div>
          <div>
            <dt>Created / updated (UTC)</dt>
            <dd>
              {displayTimestamp(record.createdAt)} /{" "}
              {displayTimestamp(record.updatedAt)}
            </dd>
          </div>
        </dl>
        <p className="input-help">Check-in ID: {record.id}</p>
      </div>
    </details>
  );
}
export function HealthHistory() {
  const { records, today } = useHealth();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const invalid = !!(
    (from && !isMissionDate(from)) ||
    (to && !isMissionDate(to)) ||
    (from && to && from > to)
  );
  const selected = invalid ? [] : filterRecords(records, from, to);
  const latest = latestRecord(selected);
  return (
    <>
      <section
        className="panel history-filters"
        aria-label="Filter history by mission date"
      >
        <div className="form-field">
          <label htmlFor="history-from">From mission date (UTC)</label>
          <input
            id="history-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-invalid={invalid}
            aria-describedby={invalid ? "history-range-error" : undefined}
          />
        </div>
        <div className="form-field">
          <label htmlFor="history-to">Through mission date (UTC)</label>
          <input
            id="history-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-invalid={invalid}
            aria-describedby={invalid ? "history-range-error" : undefined}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setFrom("");
            setTo("");
          }}
          disabled={!from && !to}
        >
          Clear filters
        </Button>
        <span role="status" className="filter-count">
          {selected.length} of {records.length} check-ins
        </span>
        {invalid && (
          <p id="history-range-error" className="field-error">
            Choose valid dates with the start on or before the end.
          </p>
        )}
      </section>
      {!records.length ? (
        <section className="panel records-empty">
          <History size={30} />
          <h2>Your history starts with one check-in.</h2>
          <p>
            No demo records are stored in this browser. New check-ins will
            appear here and on the dashboard.
          </p>
          <Button asChild>
            <Link href="/daily-health-check">
              Record a check-in
              <ArrowRight size={15} />
            </Link>
          </Button>
        </section>
      ) : !selected.length ? (
        <section className="panel records-empty">
          <h2>
            {invalid ? "Check the date range" : "No check-ins in this range"}
          </h2>
          <p>
            Adjust or clear the mission-date filters to see your stored records.
          </p>
        </section>
      ) : (
        <>
          <div className="section-heading">
            <div>
              <h2>Most recently recorded in this range</h2>
              <p>
                Summary values come from one check-in; missing readings remain
                empty.
              </p>
            </div>
          </div>
          <LatestMeasurements record={latest} />
          <HealthCharts records={selected} today={today} full />
          <div className="section-heading">
            <div>
              <h2>Check-in log</h2>
              <p>
                Newest submission timestamp first. Expand a check-in for all
                values, notes and provenance.
              </p>
            </div>
          </div>
          <div className="history-list">
            {selected.map((record) => (
              <CheckInDetails record={record} key={record.id} />
            ))}
          </div>
        </>
      )}
      <ResetDemoData />
    </>
  );
}
