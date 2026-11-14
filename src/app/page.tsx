"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  CircleCheck,
  Clock3,
  FlaskConical,
  Orbit,
  Sparkles,
  BookOpen,
  CalendarDays,
} from "lucide-react";
import { PageLayout, PageHeading } from "@/components/page-layout";
import { LatestMeasurements } from "@/components/metric-card";
import { HealthCharts } from "@/components/health-charts";
import { ObservationCard } from "@/components/observation-card";
import { Button } from "@/components/ui/button";
import { mission } from "@/lib/mock-data";
import { useHealth } from "@/components/health-provider";
import { DemoBanner, HealthDataBoundary } from "@/components/demo-status";
import {
  hasCompleteCheckInForDate,
  latestRecord,
  sourceLabel,
} from "@/lib/health/selectors";
import { displayDate, displayTimestamp } from "@/lib/health/dates";
export default function Overview() {
  const { records, today } = useHealth();
  const latest = latestRecord(records);
  const todayRecorded = hasCompleteCheckInForDate(records, today);
  const observations = [
    {
      kind: "heart" as const,
      title: latest
        ? "Your most recent stored check-in"
        : "Your record is ready to begin",
      detail: latest
        ? `Mission date: ${displayDate(latest.missionDate)}. Source: ${sourceLabel(latest.source)}. Each summary card uses this same record; missing measurements are left empty.`
        : "Record a demo check-in to populate your dashboard. No measurements are inferred or automatically measured.",
    },
    {
      kind: "sleep" as const,
      title: "Context stays with the measurements",
      detail: `${records.length} check-ins stored in this browser, including ${records.filter((record) => record.source === "user-entered-demo").length} user-entered demo entries. Open Health History for timestamps, symptoms and notes. These counts are not a health assessment.`,
    },
  ];
  return (
    <PageLayout>
      <PageHeading
        eyebrow="MISSION CONTROL / CREW HEALTH"
        title="Mission Overview"
        description="A clearer view of your health. A little closer to home."
        action={
          <span className="phase-pill">
            <FlaskConical size={14} />
            Research demo <span>v0.2</span>
          </span>
        }
      />
      <section className="welcome-panel" aria-labelledby="welcome-title">
        <div className="welcome-content">
          <p className="eyebrow">
            <span className="status-dot" /> {mission.name.toUpperCase()}
          </p>
          <h2 id="welcome-title">
            Welcome back, Alex<span>.</span>
          </h2>
          <p>Every check-in is a step toward understanding your journey.</p>
          <div className="welcome-meta">
            <span>
              <Orbit size={15} />
              {mission.station}
            </span>
            <span className="crew-id">
              CREW ID <strong>{mission.crewId}</strong>
            </span>
          </div>
        </div>
        <div className="orbital-art" aria-hidden="true">
          <div className="orbital-ring ring-one" />
          <div className="orbital-ring ring-two" />
          <div className="planet" />
          <span className="orbit-satellite">
            <Orbit size={23} />
          </span>
        </div>
        <div className="mission-day">
          <span>FICTIONAL SCENARIO DAY</span>
          <p>
            {String(mission.day).padStart(3, "0")}
            <small>/ {mission.duration}</small>
          </p>
          <div
            className="mission-progress"
            role="progressbar"
            aria-label="Mission elapsed"
            aria-valuenow={mission.day}
            aria-valuemin={0}
            aria-valuemax={mission.duration}
          >
            <span
              style={{ width: `${(mission.day / mission.duration) * 100}%` }}
            />
          </div>
          <small>One day at a time. Always forward.</small>
        </div>
      </section>
      <DemoBanner />
      <HealthDataBoundary>
        <div className="section-heading metrics-heading">
          <div>
            <h2>Latest recorded measurements</h2>
          </div>
          <span className="subtle-label">
            <Clock3 size={13} />
            {latest ? (
              <time dateTime={latest.recordedAt}>
                {displayTimestamp(latest.recordedAt)}
              </time>
            ) : (
              "No saved check-ins"
            )}
          </span>
        </div>
        <LatestMeasurements record={latest} />
        <div className="checkin-strip">
          <span className="checkin-icon">
            <CircleCheck size={20} />
          </span>
          <div>
            <strong>
              {todayRecorded
                ? "Today’s user-entered demo check-in is complete"
                : "Today’s demo check-in is ready to record"}
            </strong>
            <p>
              {today && displayDate(today)} · Mission-local calendar: UTC.
              Synthetic seed records do not complete your daily check-in.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/daily-health-check">
              Record a new check-in
              <ArrowRight size={15} />
            </Link>
          </Button>
        </div>
        {!latest && (
          <div className="panel records-empty">
            <h2>No check-ins yet</h2>
            <p>
              Save a demo check-in to start your record. Empty charts contain no
              inferred measurements.
            </p>
          </div>
        )}
        {today && <HealthCharts records={records} today={today} />}
        <div className="bottom-grid">
          <section
            className="panel observations-panel"
            aria-labelledby="observations-title"
          >
            <div className="panel-title">
              <h2 id="observations-title">
                <Sparkles size={17} />
                Record context
              </h2>
              <span className="mini-label">DESCRIPTIVE ONLY</span>
            </div>
            {observations.map((o) => (
              <ObservationCard
                key={o.kind}
                observation={o}
                recordedAt={latest?.recordedAt}
              />
            ))}
            <div className="observation-footer">
              Stored record summaries, not a clinical assessment.
              <Link href="/health-insights">
                About insights
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </section>
          <section
            className="panel knowledge-panel"
            aria-labelledby="knowledge-title"
          >
            <div className="panel-title">
              <h2 id="knowledge-title">
                <BookOpen size={17} />
                Life beyond Earth
              </h2>
            </div>
            <div className="knowledge-illustration" aria-hidden="true">
              <span className="window-grid" />
              <Orbit size={50} strokeWidth={1} />
              <span className="tiny-star star-one" />
              <span className="tiny-star star-two" />
            </div>
            <p className="eyebrow">SPACE HEALTH / SLEEP IN ORBIT</p>
            <h3>
              Sixteen sunrises.
              <br />
              One body clock.
            </h3>
            <p>
              ISS crews experience about 16 sunrises and sunsets each day. These
              changing light cues can disrupt the sleep-wake cycle.
            </p>
            <a
              className="text-link"
              href="https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/"
              target="_blank"
              rel="noreferrer"
            >
              Read NASA’s sleep research{" "}
              <span className="sr-only">(opens in a new tab)</span>
              <ArrowUpRight size={16} />
            </a>
          </section>
        </div>
        <div className="provenance">
          <FlaskConical size={15} />
          <p>
            <strong>Designed for exploration.</strong> Crew details are
            fictional. Synthetic seeds and your user-entered demo readings are
            kept in this browser only. Clearing browser site data deletes them.
            No clinical assessment or live telemetry is provided.
          </p>
          <CalendarDays size={17} />
        </div>
      </HealthDataBoundary>
    </PageLayout>
  );
}
