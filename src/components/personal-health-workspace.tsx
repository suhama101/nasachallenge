"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { AstronautProfileRow } from "@/lib/health/database.types";
import type { HealthCheckIn } from "@/lib/health/validation";
import { isMissionDate } from "@/lib/health/validation";
import {
  filterRecords,
  latestRecord,
  hasCompleteCheckInForDate,
} from "@/lib/health/selectors";
import { displayDate, displayTimestamp } from "@/lib/health/dates";
import {
  analyzeHealthRecords,
  observationTimeline,
} from "@/lib/insights/analyze";
import {
  indicatorConfig,
  numericIndicators,
  type NumericIndicator,
} from "@/lib/insights/config";
import { scientificReferences } from "@/lib/insights/references";
import { knowledgeEntries } from "@/lib/knowledge/content";
import { environmentLabels } from "@/lib/auth/validation";
import {
  PersonalHealthProvider,
  usePersonalHealth,
} from "./personal-health-provider";
import { HealthCheckInForm } from "./daily-health-form";
import { CheckInDetails } from "./health-history";
import { LatestMeasurements } from "./metric-card";
import { HealthCharts } from "./health-charts";
import { BaselineComparisons } from "./health-insights";
import { InsightCard } from "./insight-card";
import { InsightsAnalytics } from "./insights-analytics";
import { Button } from "./ui/button";
import { JourneyCards } from "./journey-cards";
import { IndicatorGuide } from "./indicator-guide";
import { InsightsStart, InsightsComparison } from "./insights-summary";
const csaResearch = knowledgeEntries.find(
  (entry) => entry.id === "space-research",
);

export type PersonalSection =
  "overview" | "daily-health-check" | "health-history" | "health-insights";
export function PersonalMonitoring({
  userId,
  profile,
  section,
}: {
  userId: string;
  profile: AstronautProfileRow;
  section: PersonalSection;
}) {
  return (
    <PersonalHealthProvider
      key={`${userId}:${profile.id}`}
      userId={userId}
      profileId={profile.id}
    >
      <PersonalPage profile={profile} section={section} />
    </PersonalHealthProvider>
  );
}
function PersonalPage({
  profile,
  section,
}: {
  profile: AstronautProfileRow;
  section: PersonalSection;
}) {
  const health = usePersonalHealth();
  const titles = {
    overview: `Welcome, ${profile.display_name}`,
    "daily-health-check": "Daily Health Check",
    "health-history": "Health History",
    "health-insights": "Understand Your Health",
  };
  return (
    <div className="personal-monitoring" data-section={section}>
      {section === "overview" ? (
        <header className="overview-hero">
          <div className="overview-greeting">
            <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
            <h1>{titles[section]}</h1>
            <p className="overview-mission">
              <strong>{profile.mission_name}</strong>
              <span>Crew {profile.crew_identifier}</span>
            </p>
          </div>
          <dl className="profile-summary overview-profile">
            <div>
              <dt>Environment</dt>
              <dd>{environmentLabels[profile.mission_environment]}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{profile.role || "Not added"}</dd>
            </div>
            <div>
              <dt>Mission start</dt>
              <dd>{profile.mission_start_date || "Not added"}</dd>
            </div>
          </dl>
          <p className="overview-records-note">
            Manually entered research / simulation records, saved to your
            account. No device is connected. Explore Demo records remain
            separate.
          </p>
        </header>
      ) : (
        <>
          <p className="eyebrow">YOUR PERSONAL MISSION WORKSPACE</p>
          <h1>{titles[section]}</h1>
          <p className="account-intro">
            {section === "health-insights" ? (
              "Learn what your measurements mean, track changes, and understand how spaceflight can affect health."
            ) : (
              <>
                {profile.mission_name} · {profile.crew_identifier}. Manually
                entered research / simulation records, saved to your account. No
                medical device is connected.
              </>
            )}
          </p>
          {section !== "health-insights" && (
            <p className="personal-privacy-note">
              Only your account’s records are used here. Demo scenarios remain
              separate. These views describe your entries; they do not provide a
              diagnosis or verify astronaut status.
            </p>
          )}
        </>
      )}
      {health.error && (
        <div role="alert" className="account-error">
          <p>{health.error}</p>
          <Button variant="outline" onClick={() => void health.refresh()}>
            Retry loading history
          </Button>
        </div>
      )}
      {section === "daily-health-check" ? (
        health.today ? (
          <HealthCheckInForm
            personal
            profileLabel={`${profile.display_name} / ${profile.crew_identifier}`}
            today={health.today}
            save={health.save}
          />
        ) : (
          <Loading />
        )
      ) : health.loading ? (
        <Loading />
      ) : health.error ? null : section === "overview" ? (
        <PersonalOverview />
      ) : section === "health-history" ? (
        <PersonalHistory profile={profile} />
      ) : (
        <PersonalInsights profileId={profile.id} />
      )}
    </div>
  );
}
function Loading() {
  return (
    <p className="account-notice" role="status">
      Loading your personal workspace…
    </p>
  );
}
function EmptyHistory() {
  return (
    <section className="panel records-empty">
      <h2>Your history starts with one check-in</h2>
      <p>
        No personal check-ins have been saved yet. Nothing from Explore Demo is
        imported.
      </p>
      <Button asChild>
        <Link href="/astronaut/daily-health-check">
          Record your first check-in
        </Link>
      </Button>
    </section>
  );
}
function PersonalOverview() {
  const { records, today } = usePersonalHealth();
  const latest = latestRecord(records);
  return (
    <>
      <section
        className="overview-status"
        aria-label="Personal check-in status"
      >
        <strong>
          {records.length} saved{" "}
          {records.length === 1 ? "check-in" : "check-ins"}
        </strong>
        <p>
          {hasCompleteCheckInForDate(records, today)
            ? "Today’s personal check-in is complete"
            : "Ready for today’s check-in."}
        </p>
      </section>
      <JourneyCards personal compact />
      <p className="overview-missing-note">
        Missing measurements stay “Not recorded” and are excluded from
        calculations. One check-in does not establish a trend.
      </p>
      {latest && (
        <details className="panel overview-measurements">
          <summary>Latest measurements &amp; history charts</summary>
          <LatestMeasurements record={latest} />
          <HealthCharts records={records} today={today} full />
        </details>
      )}
    </>
  );
}
function PersonalHistory({ profile }: { profile: AstronautProfileRow }) {
  const { records, today, update, remove, refresh } = usePersonalHealth();
  const [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const [editing, setEditing] = useState<HealthCheckIn | null>(null),
    [deleting, setDeleting] = useState<HealthCheckIn | null>(null);
  const [notice, setNotice] = useState("");
  const invalid = !!(
    (from && !isMissionDate(from)) ||
    (to && !isMissionDate(to)) ||
    (from && to && from > to)
  );
  const selected = invalid ? [] : filterRecords(records, from, to);
  if (editing)
    return (
      <section className="personal-editor">
        <h2>Edit check-in · {displayDate(editing.missionDate)}</h2>
        <p className="account-notice">
          Original submission time and ownership are preserved. Changes require
          your confirmation. To avoid overwriting another edit, a changed record
          must be reloaded first.
        </p>
        <HealthCheckInForm
          key={editing.id}
          personal
          profileLabel={`${profile.display_name} / ${profile.crew_identifier}`}
          today={today}
          initialRecord={editing}
          save={(input) => update(editing, input)}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setNotice("Your check-in changes were saved.");
          }}
        />
      </section>
    );
  return (
    <>
      {notice && (
        <p className="account-success" role="status">
          {notice}
        </p>
      )}
      {!records.length ? (
        <EmptyHistory />
      ) : (
        <>
          <section className="panel history-guide">
            <h2>Your saved check-ins</h2>
            <p>
              Newest submissions appear first. “Not recorded” means no value was
              entered. Open an entry to review its readings, symptoms, notes,
              and timestamps.
            </p>
          </section>
          <section
            className="panel history-filters"
            aria-label="Filter personal history"
          >
            <div className="form-field">
              <label htmlFor="personal-from">From mission date (UTC)</label>
              <input
                id="personal-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                aria-invalid={invalid}
              />
            </div>
            <div className="form-field">
              <label htmlFor="personal-to">Through mission date (UTC)</label>
              <input
                id="personal-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                aria-invalid={invalid}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
            >
              Clear filters
            </Button>
            <Button variant="outline" onClick={() => void refresh()}>
              Refresh history
            </Button>
            <p role="status">
              {selected.length} of {records.length} check-ins
            </p>
            {invalid && (
              <p role="alert">
                Choose valid dates with the start before the end.
              </p>
            )}
          </section>
          {!invalid && !selected.length && (
            <p className="account-notice">
              No check-ins match those dates. Clear the filters to see your
              history.
            </p>
          )}
          {selected.map((record) => (
            <section
              key={record.id}
              className="personal-history-record"
              data-record-id={record.id}
            >
              <CheckInDetails record={record} personal />
              <div className="account-actions">
                <Button variant="outline" onClick={() => setEditing(record)}>
                  Edit check-in
                </Button>
                <Button variant="outline" onClick={() => setDeleting(record)}>
                  Delete check-in
                </Button>
              </div>
            </section>
          ))}
          {selected.length > 0 && (
            <HealthCharts records={selected} today={today} full />
          )}
        </>
      )}
      {deleting && (
        <DeleteConfirmation
          record={deleting}
          onCancel={() => setDeleting(null)}
          onDelete={async () => {
            await remove(deleting);
            setDeleting(null);
            setNotice("Your check-in was deleted.");
          }}
        />
      )}
    </>
  );
}
function DeleteConfirmation({
  record,
  onCancel,
  onDelete,
}: {
  record: HealthCheckIn;
  onCancel: () => void;
  onDelete: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    locked = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const node = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    node?.showModal();
    node?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      node?.close();
      if (previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-checkin-title"
      className="personal-delete-dialog"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id="delete-checkin-title">Delete this check-in?</h2>
      <p>
        Mission date: {displayDate(record.missionDate)}. Submitted{" "}
        {displayTimestamp(record.recordedAt)}. This removes only this account’s
        selected check-in and cannot be undone.
      </p>
      {error && (
        <p role="alert" className="account-error">
          {error}
        </p>
      )}
      <div className="account-actions">
        <Button variant="outline" disabled={busy} onClick={onCancel}>
          Keep check-in
        </Button>
        <Button
          disabled={busy}
          onClick={async () => {
            if (locked.current) return;
            locked.current = true;
            setBusy(true);
            setError("");
            try {
              await onDelete();
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : "Deletion could not be confirmed.",
              );
            } finally {
              locked.current = false;
              setBusy(false);
            }
          }}
        >
          {busy ? "Deleting…" : "Delete this check-in"}
        </Button>
      </div>
    </dialog>
  );
}
function PersonalInsights({ profileId }: { profileId: string }) {
  const { records, asOf } = usePersonalHealth();
  const [indicator, setIndicator] = useState<NumericIndicator>("heartRate"),
    [days, setDays] = useState<7 | 30>(30);
  const options = useMemo(
    () => ({ profileId, asOf, mode: "authenticated" as const, minBaseline: 5 }),
    [profileId, asOf],
  );
  const report = useMemo(
    () => analyzeHealthRecords(records, options),
    [records, options],
  );
  const timeline = useMemo(
    () => observationTimeline(records, options, days),
    [records, options, days],
  );
  const analytics = (
    <>
      <div className="panel analytics-controls">
        <div className="form-field">
          <label htmlFor="personal-indicator">Trend indicator</label>
          <select
            id="personal-indicator"
            value={indicator}
            onChange={(e) => setIndicator(e.target.value as NumericIndicator)}
          >
            {numericIndicators.map((key) => (
              <option key={key} value={key}>
                {indicatorConfig[key].label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="personal-days">Analytics time range</label>
          <select
            id="personal-days"
            value={days}
            onChange={(e) => setDays(Number(e.target.value) as 7 | 30)}
          >
            <option value={7}>Last 7 mission dates</option>
            <option value={30}>Last 30 mission dates</option>
          </select>
        </div>
      </div>
      <InsightsAnalytics
        report={report}
        indicator={indicator}
        days={days}
        timeline={timeline}
        guided
      />
    </>
  );
  return (
    <div className="guided-insights" data-record-count={records.length}>
      <InsightsStart report={report} count={records.length} personal />
      {report.observations
        .filter((observation) => observation.kind === "urgent")
        .map((observation) => (
          <InsightCard key={observation.id} observation={observation} />
        ))}
      {records.length > 1 && analytics}
      {records.length > 0 && <InsightsComparison report={report} />}
      {records.length > 1 &&
        report.observations.some(
          (observation) => observation.kind !== "urgent",
        ) && (
          <details className="panel insights-observations-details">
            <summary>
              Recorded change observations · evidence &amp; next steps
            </summary>
            <section
              className="personal-observations"
              aria-label="Personal monitoring observations"
            >
              {report.observations
                .filter((observation) => observation.kind !== "urgent")
                .map((observation) => (
                  <InsightCard key={observation.id} observation={observation} />
                ))}
            </section>
          </details>
        )}
      <IndicatorGuide />
      <details className="panel insights-advanced">
        <summary>Advanced Analysis</summary>
        <p>
          Exact statistics, assumptions, data availability and research detail.
          These descriptive prototype rules are not clinically validated.
        </p>
        <section className="panel personal-insights-note">
          <h2>Understand your own patterns</h2>
          <p>
            Comparisons use your earlier distinct mission dates, excluding the
            current day. At least five usable earlier dates are needed for a
            personal baseline. Missing readings remain missing; insufficient
            history is not a reassurance about health.
          </p>
          <p>
            Statistics and change labels are descriptive prototype rules, not
            clinical thresholds, diagnoses, emergency predictions, or
            NASA-endorsed assessments.
          </p>
          <p>
            {report.records.length} personal records available for analysis.
          </p>
          <a className="guide-jump" href="#understand-your-health">
            Learn what your measurements mean →
          </a>
          {report.limitations.length > 0 && (
            <details>
              <summary>Data completeness and limitations</summary>
              <ul>
                {report.limitations.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </details>
          )}
        </section>
        <BaselineComparisons report={report} />
        {records.length <= 1 && analytics}
        <section>
          <h2>Space health research context</h2>
          <p className="account-intro">
            Educational sources explain spaceflight research; they do not
            validate this application’s statistical rules or diagnose your
            health.
          </p>
          <div className="reference-grid">
            {scientificReferences.map((reference) => (
              <article key={reference.id} className="panel reference-card">
                <h3>{reference.topic}</h3>
                <p>{reference.explanation}</p>
                <p>{reference.limitations}</p>
                <a href={reference.url} target="_blank" rel="noreferrer">
                  {reference.organization} · {reference.title}
                </a>
              </article>
            ))}
            {csaResearch && (
              <article className="panel reference-card">
                <h3>{csaResearch.title}</h3>
                <p>{csaResearch.summary}</p>
                <p>{csaResearch.limitations}</p>
                <a
                  href={csaResearch.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {csaResearch.organization} · {csaResearch.sourceTitle}
                </a>
              </article>
            )}
          </div>
        </section>
      </details>
    </div>
  );
}
