"use client";
import { IndicatorGuide } from "./indicator-guide";
import { InsightsStart, InsightsComparison } from "./insights-summary";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Orbit,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useInsights } from "./insights-provider";
import { InsightCard, CategoryBadge } from "./insight-card";
import { InsightsAnalytics } from "./insights-analytics";
import { Button } from "./ui/button";
import { scenarioDefinitions, type ScenarioId } from "@/lib/insights/scenarios";
import {
  indicatorConfig,
  numericIndicators,
  ruleDescription,
  type NumericIndicator,
} from "@/lib/insights/config";
import {
  formatIndicatorValue,
  observationTimeline,
} from "@/lib/insights/analyze";
import { scientificReferences } from "@/lib/insights/references";
import { displayDate, displayTimestamp } from "@/lib/health/dates";
import { sourceLabel } from "@/lib/health/selectors";
import { mission } from "@/lib/mock-data";
import { spo2NeedsReview, spo2Label } from "@/lib/health/integrity";
import type { AnalysisReport } from "@/lib/insights/types";

export function BaselineComparisons({ report }: { report: AnalysisReport }) {
  const urgent = report.urgentRecordIds.length > 0;
  return (
    <section aria-labelledby="baseline-title">
      <div className="section-heading">
        <div>
          <h2 id="baseline-title">Personal baseline comparisons</h2>
          <p>
            Rolling median of earlier usable mission dates (mood uses the mode).
            The current mission date is excluded in full.
          </p>
        </div>
      </div>
      <div className="panel table-scroll baseline-table">
        <table>
          <caption>
            Current analysis record:{" "}
            {report.current
              ? `${displayDate(report.current.missionDate)} · ${sourceLabel(report.current.source)} · submitted ${displayTimestamp(report.current.recordedAt)}`
              : "No usable current record"}
            . Baseline window: preceding {report.configuration.baselineDays}{" "}
            days. Minimum: {report.configuration.minBaseline} earlier days.
          </caption>
          <thead>
            <tr>
              <th scope="col">Indicator</th>
              <th scope="col">Current</th>
              <th scope="col">Earlier baseline</th>
              <th scope="col">Absolute / relative change</th>
              <th scope="col">Samples & period</th>
              <th scope="col">Monitoring evidence</th>
            </tr>
          </thead>
          <tbody>
            {report.metrics.map((metric) => (
              <tr key={metric.key}>
                <th scope="row">{indicatorConfig[metric.key].label}</th>
                <td>
                  {metric.key === "spo2" &&
                  spo2NeedsReview(report.current?.spo2)
                    ? spo2Label(report.current?.spo2)
                    : formatIndicatorValue(
                        metric.key,
                        metric.current?.value ?? null,
                      )}
                </td>
                <td>
                  {metric.baseline === null
                    ? "Insufficient baseline data"
                    : formatIndicatorValue(metric.key, metric.baseline, true)}
                </td>
                <td>
                  {metric.difference !== null
                    ? `${metric.difference > 0 ? "+" : ""}${Number(metric.difference.toFixed(1))} ${metric.key === "spo2" ? "percentage points" : indicatorConfig[metric.key].unit}`
                    : "Not numeric / unavailable"}
                  <small>
                    {metric.percentageChange !== null
                      ? `${metric.percentageChange > 0 ? "+" : ""}${metric.percentageChange.toFixed(1)}% relative change (descriptive)`
                      : metric.baseline === 0
                        ? "Relative change undefined: zero baseline"
                        : "No relative percentage available"}
                  </small>
                </td>
                <td>
                  {metric.baselineCount} earlier days
                  <small>
                    {metric.baselineFrom && metric.baselineTo
                      ? `${displayDate(metric.baselineFrom)}–${displayDate(metric.baselineTo)}`
                      : "No usable reference period"}
                  </small>
                </td>
                <td>
                  <CategoryBadge
                    category={urgent ? "review" : metric.category}
                  />
                  {urgent && (
                    <small>Urgent report overrides statistical category</small>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="panel methodology-details">
        <summary>
          Indicator calculations, assumptions & all baseline values
        </summary>
        <p>
          These configurable software rules are proposed for demonstration, not
          clinically validated thresholds. “Stable” means a comparison did not
          meet the stated rule; it does not establish health or safety.
        </p>
        {report.metrics.map((metric) => (
          <section className="indicator-method" key={metric.key}>
            <h3>{indicatorConfig[metric.key].label}</h3>
            <p>{ruleDescription(metric.key)}</p>
            <dl className="statistic-grid">
              <div>
                <dt>7-day arithmetic mean</dt>
                <dd>
                  {metric.rolling7 === null
                    ? "Not available"
                    : `${formatIndicatorValue(metric.key, metric.rolling7, true)} · n=${metric.rolling7Count}`}
                </dd>
              </div>
              <div>
                <dt>30-day arithmetic mean</dt>
                <dd>
                  {metric.rolling30 === null
                    ? "Not available"
                    : `${formatIndicatorValue(metric.key, metric.rolling30, true)} · n=${metric.rolling30Count}`}
                </dd>
              </div>
              <div>
                <dt>7-day population standard deviation</dt>
                <dd>
                  {metric.variability === null
                    ? "Not available"
                    : `${metric.variability.toFixed(2)} ${metric.key === "spo2" ? "percentage points" : indicatorConfig[metric.key].unit}`}
                </dd>
              </div>
              <div>
                <dt>7-day linear slope</dt>
                <dd>
                  {metric.slope === null
                    ? "Insufficient numeric samples"
                    : `${metric.slope.toFixed(2)} ${metric.key === "spo2" ? "percentage points" : indicatorConfig[metric.key].unit} per calendar day · n=${metric.trendSamples}`}
                </dd>
              </div>
              <div>
                <dt>Consecutive changes</dt>
                <dd>
                  {metric.consecutive.intervals} {metric.consecutive.direction}{" "}
                  intervals
                </dd>
              </div>
              <div>
                <dt>Repeated baseline deviations</dt>
                <dd>{metric.repeatedDeviations} consecutive days</dd>
              </div>
            </dl>
            <ul>
              {metric.limitations.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <details>
              <summary>Show {metric.baselineCount} baseline records</summary>
              <div className="table-scroll">
                <table>
                  <caption>
                    {indicatorConfig[metric.key].label} · all valid baseline
                    values retained
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Mission date</th>
                      <th scope="col">Value</th>
                      <th scope="col">Source</th>
                      <th scope="col">Record ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metric.baselineEvidence.map((point) => (
                      <tr key={point.id}>
                        <th scope="row">{displayDate(point.missionDate)}</th>
                        <td>
                          {formatIndicatorValue(metric.key, point.value)}
                          {metric.outlierIds.includes(point.id)
                            ? " · distant value retained"
                            : ""}
                        </td>
                        <td>{sourceLabel(point.source)}</td>
                        <td className="record-id">{point.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>
        ))}
      </details>
    </section>
  );
}

export function HealthInsights() {
  const {
    report,
    selectedRecords,
    options,
    selection,
    select,
    minBaseline,
    setMinBaseline,
    scenarioUrgency,
    setScenarioUrgency,
  } = useInsights();
  const [days, setDays] = useState<7 | 30>(7);
  const [trendChoice, setTrendChoice] = useState<{
    selection: string;
    indicator: NumericIndicator;
  }>({ selection: "saved", indicator: "heartRate" });
  const indicator =
    trendChoice.selection === selection
      ? trendChoice.indicator
      : (scenarioDefinitions.find((item) => item.id === selection)?.indicator ??
        "heartRate");
  const setIndicator = (value: NumericIndicator) =>
    setTrendChoice({ selection, indicator: value });
  const timeline = useMemo(
    () =>
      report?.validClock
        ? observationTimeline(selectedRecords, options, days)
        : [],
    [selectedRecords, options, days, report?.validClock],
  );
  if (!report) return <p role="status">Preparing local analysis…</p>;
  const scenario = scenarioDefinitions.find((item) => item.id === selection);
  const urgent = report.urgentRecordIds.length > 0;
  const distinctEvidence = new Set(
    report.observations.flatMap((observation) =>
      observation.evidence.map((point) => point.id),
    ),
  ).size;
  const changedObservations = report.observations.filter(
    (observation) => observation.category !== "stable",
  );
  const visibleObservations = changedObservations.length
    ? changedObservations
    : report.observations.slice(0, 2);
  const otherObservations = report.observations.filter(
    (observation) =>
      !visibleObservations.some((visible) => visible.id === observation.id),
  );
  const analytics = (
    <>
      <div
        className="panel analytics-controls"
        aria-label="Visual analytics settings"
      >
        <div className="form-field">
          <label htmlFor="insight-indicator">Trend indicator</label>
          <select
            id="insight-indicator"
            value={indicator}
            onChange={(event) =>
              setIndicator(event.target.value as NumericIndicator)
            }
          >
            {numericIndicators.map((key) => (
              <option value={key} key={key}>
                {indicatorConfig[key].label} ({indicatorConfig[key].unit})
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="insight-days">Analytics time range</label>
          <select
            id="insight-days"
            value={days}
            onChange={(event) => setDays(Number(event.target.value) as 7 | 30)}
          >
            <option value={7}>Last 7 mission dates</option>
            <option value={30}>Last 30 mission dates</option>
          </select>
        </div>
        <p>
          Missing dates remain visible as gaps. Mood stays categorical in the
          baseline table; it is not assigned an invented numeric score.
        </p>
      </div>
      {report.validClock && (
        <InsightsAnalytics
          report={report}
          indicator={indicator}
          days={days}
          timeline={timeline}
          guided
        />
      )}
    </>
  );
  const observations = (
    <>
      <section aria-labelledby="latest-observations-title">
        <div className="section-heading">
          <div>
            <h2 id="latest-observations-title">
              <Sparkles size={16} />
              Latest health observations
            </h2>
            <p>
              Descriptive software comparisons. Select an observation’s evidence
              to inspect its records and exact rule.
            </p>
          </div>
        </div>
        {urgent ? (
          <div className="panel records-empty">
            <h3>Statistical observation list withheld</h3>
            <p>
              The explicit urgent report above takes priority over all baseline
              categories. No automated symptom-resolution or approved clinical
              protocol is configured.
            </p>
          </div>
        ) : report.observations.length ? (
          <>
            <div className="insights-observation-grid">
              {visibleObservations.map((observation) => (
                <InsightCard observation={observation} key={observation.id} />
              ))}
            </div>
            {otherObservations.length > 0 && (
              <details className="panel methodology-details">
                <summary>
                  Expand {otherObservations.length} additional stable
                  statistical comparisons
                </summary>
                <p>
                  These comparisons did not meet the prototype change rule. They
                  do not establish health or safety.
                </p>
                <div className="insights-observation-grid">
                  {otherObservations.map((observation) => (
                    <InsightCard
                      observation={observation}
                      key={observation.id}
                    />
                  ))}
                </div>
              </details>
            )}
          </>
        ) : (
          <div className="panel records-empty">
            <CategoryBadge category="insufficient" />
            <h3>No interpretable observation yet</h3>
            <p>
              Usable current readings, recent submissions and at least{" "}
              {minBaseline} earlier distinct mission dates are needed for
              baseline comparisons. Missing values are not invented.
            </p>
            <Button asChild variant="outline">
              <Link href="/daily-health-check">Record a check-in</Link>
            </Button>
          </div>
        )}
      </section>
    </>
  );
  return (
    <div className="guided-insights" data-record-count={selectedRecords.length}>
      <section
        className="panel insight-controls"
        aria-label="Analysis dataset and settings"
      >
        <div className="form-field">
          <label htmlFor="insight-dataset">
            <SlidersHorizontal size={15} />
            Analysis dataset
          </label>
          <select
            id="insight-dataset"
            value={selection}
            onChange={(event) =>
              select(event.target.value as "saved" | ScenarioId)
            }
          >
            <option value="saved">Saved local demo records</option>
            {scenarioDefinitions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="baseline-minimum">
            Minimum earlier baseline days
          </label>
          <select
            id="baseline-minimum"
            value={minBaseline}
            onChange={(event) => setMinBaseline(Number(event.target.value))}
          >
            {[3, 5, 7, 10].map((count) => (
              <option value={count} key={count}>
                {count} distinct days
              </option>
            ))}
          </select>
        </div>
        <div className="insight-controls-description">
          <strong>
            {scenario
              ? "Isolated synthetic scenario · not saved"
              : "Selected repository: this browser’s demo records"}
          </strong>
          <p>
            {scenario
              ? scenario.description
              : "The dashboard observation panel and this page share this exact analysis. No external AI service receives the records."}
          </p>
        </div>
        {scenario && (
          <div className="scenario-notice" role="status">
            <strong>{scenario.name} — synthetic preview</strong>
            <p>{scenario.context}</p>
            <p>
              Analysis uses {selectedRecords.length} separate synthetic
              check-ins for a scenario-only profile. Saved health history and
              dashboard measurement cards are unchanged. This selection affects
              both observation views until you return to saved records or
              refresh.
            </p>
            <Button size="sm" variant="outline" onClick={() => select("saved")}>
              Return to saved records
            </Button>
            <Link
              className="scenario-knowledge"
              href={`/space-health-knowledge/${scenario.knowledgeTopic}`}
            >
              Explore related NASA research →
            </Link>
          </div>
        )}
        {selection === "heart-rate" && (
          <label className="urgent-report-control">
            <input
              type="checkbox"
              checked={scenarioUrgency}
              onChange={(event) => setScenarioUrgency(event.target.checked)}
            />
            Simulate an additional urgent-symptom report (scenario only)
          </label>
        )}
      </section>
      <InsightsStart
        report={report}
        count={selectedRecords.length}
        preview={selection !== "saved"}
      />
      {urgent && <InsightCard observation={report.observations[0]} />}
      {selectedRecords.length > 1 && (
        <>
          {analytics}
          <InsightsComparison report={report} />
          {observations}
        </>
      )}
      <IndicatorGuide />
      <details className="panel insights-advanced">
        <summary>Advanced Analysis</summary>
        <p>
          Exact statistics, assumptions, data availability and research detail.
          Original records are retained; no missing readings are invented.
        </p>
        <section
          className="panel mission-analysis-context"
          aria-label="Simulated mission context"
        >
          <div>
            <Orbit size={19} />
            <h2>Fictional mission context</h2>
          </div>
          <dl>
            <div>
              <dt>Mission / scenario day</dt>
              <dd>
                {mission.name} · day {mission.day}
              </dd>
            </div>
            <div>
              <dt>Habitat / crew</dt>
              <dd>
                {mission.station} · {mission.crewId}
                {scenario ? " · isolated scenario profile" : ""}
              </dd>
            </div>
            <div>
              <dt>
                <Radio size={13} />
                Communication simulation
              </dt>
              <dd>Nominal link · simulation only</dd>
            </div>
            <div>
              <dt>Selected monitoring priorities</dt>
              <dd>Sleep · cardiovascular records · activity & fatigue</dd>
            </div>
          </dl>
          <p>
            All mission fields are simulated, with no spacecraft telemetry. They
            provide context and do not modify the statistical rules or medical
            interpretations.
          </p>
        </section>
        <section aria-labelledby="reliability-title">
          <div className="section-heading">
            <div>
              <h2 id="reliability-title">Data completeness & limitations</h2>
              <p>
                Analysis as of{" "}
                {report.validClock
                  ? displayTimestamp(report.asOf)
                  : "an invalid clock — statistics withheld"}
                . Availability does not certify accuracy.
              </p>
            </div>
          </div>
          <div className="insight-quality-grid">
            <article className="panel">
              <span>Seven-day availability</span>
              <strong>
                {report.quality.completeCells7} /{" "}
                {report.quality.expectedCells7}
              </strong>
              <p>
                Indicator-day cells recorded · {report.quality.missingDays7}{" "}
                mission dates without a check-in
              </p>
            </article>
            <article className="panel">
              <span>Latest record freshness</span>
              <strong>
                {report.stale ? "Absent / stale" : "Within prototype window"}
              </strong>
              <p>
                {report.submissionAgeHours === null
                  ? "No usable record"
                  : `${report.submissionAgeHours.toFixed(1)} hours since submission · mission date ${report.missionAgeDays} days ago`}
              </p>
            </article>
            <article className="panel">
              <span>Evidence currently used</span>
              <strong>{distinctEvidence} records</strong>
              <p>
                {report.quality.invalid} invalid · {report.quality.future}{" "}
                future · {report.quality.conflicting} conflicting IDs excluded
              </p>
            </article>
          </div>
          <details className="panel methodology-details">
            <summary>How records are selected and checked</summary>
            <ul>
              {report.limitations.map((note) => (
                <li key={note}>{note}</li>
              ))}
              <li>
                {report.quality.sameDay} earlier same-day records are not
                separate baseline samples; {report.quality.duplicate} repeated
                IDs were identified.
              </li>
              <li>
                {report.quality.otherProfile} records from other profiles and{" "}
                {report.quality.otherSource} records from a different
                storage/source cohort were excluded.
              </li>
              <li>
                Freshness is a prototype data-quality rule: at most{" "}
                {report.configuration.freshnessHours} hours since submission and
                a mission date less than two calendar days old. It is not a
                clinical standard.
              </li>
              <li>
                No physiological reference-range screening, emergency detection
                from notes, diagnoses, treatment recommendations or NASA
                endorsement is implied.
              </li>
            </ul>
          </details>
        </section>
        <BaselineComparisons report={report} />
        {selectedRecords.length <= 1 && (
          <>
            {analytics}
            {observations}
          </>
        )}
        <section aria-labelledby="scientific-context-title">
          <div className="section-heading">
            <div>
              <h2 id="scientific-context-title">
                <ShieldCheck size={17} />
                NASA research context & sources
              </h2>
              <p>
                Educational facts published by NASA. These sources do not
                validate MissionPulse’s comparison thresholds, escalation logic
                or medical accuracy.
              </p>
            </div>
          </div>
          <div className="reference-grid">
            {scientificReferences.map((reference) => (
              <article
                className="panel reference-card"
                id={`reference-${reference.id}`}
                key={reference.id}
              >
                <p className="eyebrow">EDUCATIONAL CONTEXT</p>
                <h3>{reference.topic}</h3>
                <p>{reference.explanation}</p>
                <dl>
                  <div>
                    <dt>Relevant recorded context</dt>
                    <dd>{reference.measurements.join(" · ")}</dd>
                  </div>
                  <div>
                    <dt>Limitations</dt>
                    <dd>{reference.limitations}</dd>
                  </div>
                </dl>
                <a href={reference.url} target="_blank" rel="noreferrer">
                  {reference.title}
                  <ArrowUpRight size={14} />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
                <small>
                  {reference.organization} · link/content checked{" "}
                  {displayDate(reference.verifiedOn)}
                </small>
              </article>
            ))}
          </div>
        </section>
      </details>
    </div>
  );
}
