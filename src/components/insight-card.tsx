"use client";
import {
  CircleCheck,
  CircleHelp,
  ArrowUpRight,
  ChartNoAxesCombined,
  TriangleAlert,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  categoryLabels,
  indicatorConfig,
  type MonitoringCategory,
} from "@/lib/insights/config";
import { formatIndicatorValue } from "@/lib/insights/analyze";
import { findReference } from "@/lib/insights/references";
import { displayDate, displayTimestamp } from "@/lib/health/dates";
import { sourceLabel } from "@/lib/health/selectors";
import type { InsightObservation } from "@/lib/insights/types";
import { useInsights } from "./insights-provider";
import { Button } from "./ui/button";
const categoryIcons = {
  stable: CircleCheck,
  change: ChartNoAxesCombined,
  review: TriangleAlert,
  insufficient: CircleHelp,
};
export function CategoryBadge({ category }: { category: MonitoringCategory }) {
  const Icon = categoryIcons[category];
  return (
    <span className={`monitoring-badge category-${category}`}>
      <Icon size={14} />
      {categoryLabels[category]}
    </span>
  );
}
export function InsightCard({
  observation,
  compact = false,
}: {
  observation: InsightObservation;
  compact?: boolean;
}) {
  const urgent = observation.kind === "urgent";
  return (
    <article
      className={`insight-card category-${observation.category} ${compact ? "compact" : "panel"} ${urgent ? "urgent-insight" : ""}`}
      data-insight-id={observation.id}
      role={urgent ? "alert" : undefined}
    >
      <div className="insight-card-heading">
        <h3>{observation.title}</h3>
        <CategoryBadge category={observation.category} />
      </div>
      <p>{observation.explanation}</p>
      {(!compact || urgent) && (
        <>
          <dl className="insight-explanation">
            <div>
              <dt>Compared with what?</dt>
              <dd>{observation.comparison}</dd>
            </div>
            <div>
              <dt>Reference period</dt>
              <dd>{observation.period}</dd>
            </div>
          </dl>
          <div className="monitoring-next-step">
            <strong>
              {urgent
                ? "Emergency procedure · user-declared urgency"
                : "Suggested monitoring action"}
            </strong>
            <p>{observation.nextStep}</p>
          </div>
        </>
      )}
      {!compact && (
        <>
          <details className="insight-evidence">
            <summary>Measurements, calculation & limitations</summary>
            <p>
              <strong>MissionPulse prototype logic:</strong> {observation.rule}
            </p>
            <ul>
              {observation.limitations.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            {observation.evidence.length > 0 ? (
              <div className="table-scroll">
                <table>
                  <caption>
                    Actual supporting records in this selected dataset; values
                    are not inferred
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Role / indicator</th>
                      <th scope="col">Mission date</th>
                      <th scope="col">Value</th>
                      <th scope="col">Submitted (UTC)</th>
                      <th scope="col">Source / record ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {observation.evidence.map((point, index) => (
                      <tr key={`${point.id}-${point.indicator}-${index}`}>
                        <th scope="row">
                          {point.role ?? "pattern"} ·{" "}
                          {indicatorConfig[point.indicator].label}
                        </th>
                        <td>{displayDate(point.missionDate)}</td>
                        <td>
                          {formatIndicatorValue(point.indicator, point.value)}
                        </td>
                        <td>{displayTimestamp(point.recordedAt)}</td>
                        <td>
                          {sourceLabel(point.source)}
                          <small className="record-id">{point.id}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>
                No numeric rule determines urgency. This alert follows an
                explicit urgent-report flag.
              </p>
            )}
          </details>
          {observation.references.length > 0 && (
            <div className="insight-references">
              <span>Educational context, not rule validation:</span>
              {observation.references.map((id) => {
                const reference = findReference(id);
                return reference ? (
                  <a
                    key={id}
                    href={reference.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {reference.topic}
                    <ArrowUpRight size={13} />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                ) : null;
              })}
            </div>
          )}
        </>
      )}
    </article>
  );
}
export function InsightsSummary() {
  const { report, selection, select } = useInsights();
  return (
    <section
      className="panel observations-panel insight-summary"
      aria-labelledby="computed-insights-title"
    >
      <div className="panel-title">
        <h2 id="computed-insights-title">
          <Sparkles size={17} />
          Latest monitoring observations
        </h2>
      </div>
      <div className="insight-summary-context">
        <span>
          <span>
            {selection === "saved"
              ? "Saved local demo records"
              : "Isolated synthetic scenario preview"}
          </span>
          {report?.current && (
            <small className="analysis-current-date">
              Comparison mission date: {displayDate(report.current.missionDate)}{" "}
              · {sourceLabel(report.current.source)}
            </small>
          )}
        </span>
        {selection !== "saved" && (
          <Button size="sm" variant="outline" onClick={() => select("saved")}>
            Use saved records
          </Button>
        )}
      </div>
      {report && report.observations.length > 0 ? (
        report.observations
          .slice(0, 3)
          .map((observation) => (
            <InsightCard
              observation={observation}
              key={observation.id}
              compact
            />
          ))
      ) : (
        <div className="insight-summary-empty">
          <CategoryBadge category="insufficient" />
          <p>
            No interpretable monitoring comparison yet. Record more earlier
            mission dates or review missing data in Health Insights.
          </p>
        </div>
      )}
      <div className="observation-footer">
        Prototype statistics, not clinical status.
        <Link href="/health-insights">
          Open Health Insights
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </section>
  );
}
