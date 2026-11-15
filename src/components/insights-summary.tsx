import Link from "next/link";
import { BookOpen, Heart, Orbit, Plus } from "lucide-react";
import type { AnalysisReport } from "@/lib/insights/types";
import { indicatorConfig, type Indicator } from "@/lib/insights/config";
import { formatIndicatorValue } from "@/lib/insights/analyze";
import { displayDate } from "@/lib/health/dates";
import {
  spo2NeedsReview,
  spo2Label,
  spo2ReviewMessage,
} from "@/lib/health/integrity";
import { Button } from "./ui/button";

const primary = ["heartRate", "sleep", "spo2", "temperature"] as const;
const additional = [
  "systolic",
  "diastolic",
  "exercise",
  "fatigue",
  "mood",
  "glucose",
  "water",
] as const;
type Measurement = Indicator | "glucose" | "water";
const extra = {
  glucose: { label: "Blood glucose", unit: "mg/dL" },
  water: { label: "Water intake", unit: "L" },
};

// Presentation only. Values and eligibility come from the existing report;
// the untouched original record supplies any legacy oxygen value for review.
export function InsightsStart({
  report,
  count,
  personal = false,
  preview = false,
}: {
  report: AnalysisReport;
  count: number;
  personal?: boolean;
  preview?: boolean;
}) {
  const prefix = personal ? "/astronaut" : "";
  const current = report.current;
  const original = report.records.find((row) => row.id === current?.id);
  const needsReview = report.records.some((row) => spo2NeedsReview(row.spo2));
  const measurement = (key: Measurement) => {
    const config =
      key === "glucose" || key === "water" ? extra[key] : indicatorConfig[key];
    const value = original?.[key] ?? null;
    const text =
      key === "spo2" && spo2NeedsReview(original?.spo2)
        ? spo2Label(original?.spo2)
        : key === "glucose" || key === "water"
          ? value === null
            ? "Not recorded"
            : `${value} ${config.unit}`
          : formatIndicatorValue(key, value);
    return (
      <div
        className={`insights-reading reading-${key}`}
        key={key}
        data-measurement={key}
      >
        <dt>{config.label}</dt>
        <dd>{text}</dd>
      </div>
    );
  };
  const introduction = (
    <section
      className={`panel insights-start ${count === 0 ? "insights-empty" : ""}`}
      aria-labelledby="insights-start-title"
    >
      <div className="insights-start-icon" aria-hidden="true">
        <Heart size={25} />
      </div>
      <div>
        <p className="eyebrow">
          {personal ? "YOUR PERSONAL RECORDS" : "SELECTED DEMO RECORDS"}
        </p>
        <h2 id="insights-start-title">
          {preview
            ? "Explore a fictional health pattern."
            : count === 0
              ? "Your health journey starts here."
              : count === 1
                ? "Your first health record is saved."
                : "Your records, explained step by step."}
        </h2>
        <p>
          {count === 0
            ? "You haven't recorded a health check-in yet. Record your first measurements to begin exploring your health."
            : count === 1
              ? "Keep recording over time to understand your personal patterns. One record cannot show a change over time."
              : "Start with your latest measurements, explore recorded changes, and learn what the measurements mean."}
        </p>
        <div className="insights-next-actions">
          <Button asChild>
            <Link href={`${prefix}/daily-health-check`}>
              <Plus size={16} />
              {count === 0 ? "Record My First Check-In" : "Record Another Day"}
            </Link>
          </Button>
          {count > 0 && (
            <Button asChild variant="outline">
              <Link href={`${prefix}/health-history`}>
                {personal
                  ? "View My Health History"
                  : "View Demo Health History"}
              </Link>
            </Button>
          )}
        </div>
        {count > 0 && (
          <p className="insights-record-count">
            {count} {preview ? "synthetic" : "saved"} check-in
            {count === 1 ? "" : "s"}
            {preview
              ? " in this preview only; not saved"
              : personal
                ? " in your account"
                : " in the selected demo dataset"}
            .
          </p>
        )}
      </div>
    </section>
  );
  const learning = (
    <>
      <nav
        className="insights-learning-actions"
        aria-label="Learn about your measurements"
      >
        <a href="#understand-your-health">
          <BookOpen size={19} />
          <span>What Do My Measurements Mean?</span>
        </a>
        <Link href="/space-health-knowledge">
          <Orbit size={19} />
          <span>How Does Space Affect Health?</span>
        </Link>
      </nav>
      <p className="insights-disclosure">
        {personal &&
          "Only your account’s records are used; Explore Demo stays separate. "}
        Recorded observations and educational information, not a diagnosis or a
        NASA-endorsed assessment.{" "}
        {count === 0
          ? "No records does not mean good health."
          : "Missing readings are not estimated; a comparison cannot establish health or safety."}
      </p>
    </>
  );
  return (
    <>
      {count === 0 && introduction}
      {needsReview && (
        <aside
          className="panel data-review-banner"
          role="note"
          aria-label="Oxygen readings need review"
        >
          <h2>Saved oxygen readings need review</h2>
          <p>{spo2ReviewMessage}</p>
          <Link href={`${prefix}/health-history`}>
            Review the original check-ins in Health History →
          </Link>
        </aside>
      )}
      {count > 0 && (
        <section
          className="insights-latest"
          aria-labelledby="insights-latest-title"
        >
          <div className="insights-section-heading">
            <p className="eyebrow">01 / YOUR RECORDINGS</p>
            <h2 id="insights-latest-title">Your Latest Measurements</h2>
            {current ? (
              <p>
                Mission date (UTC):{" "}
                <time dateTime={current.missionDate}>
                  {displayDate(current.missionDate)}
                </time>
                . {personal ? "Manually entered" : "Demo entries"}, not device
                telemetry.
              </p>
            ) : (
              <p>
                No measurement is available for this comparison. Your saved
                entries remain in Health History; see Advanced Analysis for
                exclusions.
              </p>
            )}
          </div>
          {current && (
            <>
              <dl className="insights-readings-grid">
                {primary.map(measurement)}
              </dl>
              <details className="insights-more-readings">
                <summary>
                  More recorded measurements · blood pressure, activity &amp;
                  optional readings
                </summary>
                <dl className="insights-readings-grid">
                  {additional.map(measurement)}
                </dl>
              </details>
            </>
          )}
        </section>
      )}
      {count > 0 && introduction}
      {learning}
    </>
  );
}

export function InsightsComparison({ report }: { report: AnalysisReport }) {
  const eligible = report.metrics.filter(
    (metric) => metric.current !== null && metric.baseline !== null,
  );
  return (
    <section
      className="panel insights-comparison"
      aria-labelledby="insights-comparison-title"
    >
      <p className="eyebrow">PERSONAL CONTEXT</p>
      <h2 id="insights-comparison-title">Compare With Your Earlier Records</h2>
      {eligible.length ? (
        <>
          <p>
            Your typical reading from earlier recorded days is shown below. The
            full comparison and exact method are in Advanced Analysis.
          </p>
          <dl className="insights-comparison-readings">
            {eligible
              .filter((metric) => primary.some((key) => key === metric.key))
              .map((metric) => (
                <div key={metric.key} data-comparison={metric.key}>
                  <dt>{indicatorConfig[metric.key].label}</dt>
                  <dd>
                    Recorded:{" "}
                    <strong>
                      {formatIndicatorValue(metric.key, metric.current!.value)}
                    </strong>
                    <br />
                    Earlier typical reading:{" "}
                    <strong>
                      {formatIndicatorValue(metric.key, metric.baseline, true)}
                    </strong>
                  </dd>
                </div>
              ))}
          </dl>
          {report.stale && (
            <p>
              These entries are outside the current-data window. They cannot
              describe your current condition.
            </p>
          )}
          {report.urgentRecordIds.length > 0 && (
            <p>
              Your explicit urgent report takes priority over statistical
              comparisons.
            </p>
          )}
        </>
      ) : (
        <p>
          More recorded days are needed for a personal comparison. At least{" "}
          {report.configuration.minBaseline === 5
            ? "five"
            : report.configuration.minBaseline}{" "}
          usable earlier mission dates are required within the preceding{" "}
          {report.configuration.baselineDays} days, for each measurement. The
          current mission date is excluded. Another check-in on the same date
          does not count as an earlier day.
        </p>
      )}
      <p className="insights-small-note">
        Missing or excluded measurements remain unavailable. Comparisons
        describe records; they are not a health assessment.
      </p>
    </section>
  );
}
