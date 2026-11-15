"use client";
import { useId } from "react";
import { chartPalette } from "./chart-palette";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalysisReport, TimelineEntry } from "@/lib/insights/types";
import {
  indicatorConfig,
  indicators,
  type NumericIndicator,
} from "@/lib/insights/config";
import { displayDate, displayTimestamp, shiftDate } from "@/lib/health/dates";
import { formatIndicatorValue } from "@/lib/insights/analyze";
import { sourceLabel } from "@/lib/health/selectors";
import {
  usableMeasurement,
  spo2NeedsReview,
  spo2Label,
} from "@/lib/health/integrity";
const tooltipStyle = {
  background: "#0e1c34",
  border: "1px solid #657a98",
  borderRadius: 12,
  color: "#eef4ff",
  fontSize: 11,
};
const tickStyle = { fill: "#b2c4d7", fontSize: 10 };

export function InsightsAnalytics({
  report,
  indicator,
  days,
  timeline,
}: {
  report: AnalysisReport;
  indicator: NumericIndicator;
  days: 7 | 30;
  timeline: TimelineEntry[];
}) {
  const id = useId();
  const metric = report.metrics.find((item) => item.key === indicator)!;
  const config = indicatorConfig[indicator];
  const today = new Date(report.asOf).toISOString().slice(0, 10);
  const byDay = new Map(report.records.map((row) => [row.missionDate, row]));
  const data = Array.from({ length: days }, (_, index) => {
    const date = shiftDate(today, index - days + 1);
    const record = byDay.get(date);
    return {
      date,
      label: displayDate(date),
      value: record ? usableMeasurement(record, indicator) : null,
      sleep: record?.sleep ?? null,
      fatigue: record?.fatigue ?? null,
      record,
    };
  });
  const comparison =
    metric.current && typeof metric.baseline === "number"
      ? [
          { name: "Current", value: metric.current.value as number },
          { name: "Earlier median", value: metric.baseline },
        ]
      : [];
  const completeness = indicators.map((key) => ({
    label: indicatorConfig[key].label,
    complete: report.records.filter(
      (row) =>
        row.missionDate >= shiftDate(today, -6) &&
        usableMeasurement(row, key) !== null,
    ).length,
  }));
  const hasTrend = data.some((point) => point.value !== null);
  const hasPaired = data.some(
    (point) => point.sleep !== null || point.fatigue !== null,
  );
  return (
    <section aria-labelledby="visual-analytics-title">
      <div className="section-heading">
        <div>
          <h2 id="visual-analytics-title">Visual analytics</h2>
          <p>
            {displayDate(data[0].date)}–{displayDate(today)} · mission dates
            (UTC). Gaps mean missing data. Series colors identify data, not clinical risk.
          </p>
        </div>
      </div>
      <div className="charts-grid insights-charts">
        <article className="panel chart-panel">
          <div className="chart-heading">
            <h3>Current vs personal baseline</h3>
            <span>{config.unit}</span>
          </div>
          <p className="analytics-caption">
            {config.label} · baseline median of {metric.baselineCount} earlier
            daily values
          </p>
          {comparison.length ? (
            <div
              className="insights-chart-canvas"
              role="img"
              aria-label={`${config.label}: current ${formatIndicatorValue(indicator, metric.current!.value)} versus baseline ${formatIndicatorValue(indicator, metric.baseline, true)}. Reported supporting values are in the baseline table and evidence details. Computed statistics are rounded for display.`}
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={comparison}
                  margin={{ top: 22, right: 15, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="#2c3b50"
                    strokeDasharray="3 5"
                  />
                  <XAxis
                    dataKey="name"
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [
                      `${value} ${config.unit}`,
                      config.label,
                    ]}
                  />
                  <Bar
                    dataKey="value"
                    maxBarSize={75}
                    isAnimationActive={false}
                  >
                    {comparison.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={index ? "#a4b7d1" : chartPalette[indicator]}
                        stroke={index ? "#e4ecf7" : chartPalette[indicator]}
                        strokeDasharray={index ? "4 3" : undefined}
                      />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="top"
                      fill="#dce9f5"
                      formatter={(value) => Number(Number(value).toFixed(1))}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="chart-empty">
              Insufficient baseline data or no current measurement. No
              comparison bar is invented.
            </div>
          )}
        </article>
        <article className="panel chart-panel">
          <div className="chart-heading">
            <h3>
              {config.label} · {days}-day trend
            </h3>
            <span>{config.unit}</span>
          </div>
          <p className="analytics-caption">
            Solid line: records · dashed: current comparison median
          </p>
          {hasTrend ? (
            <div
              className="insights-chart-canvas"
              role="img"
              aria-label={`${days}-day ${config.label} trend in ${config.unit}. Missing dates and readings are gaps. Baseline is the current comparison median, not a historical rolling baseline.`}
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart
                  data={data}
                  margin={{ top: 15, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="#2c3b50"
                    strokeDasharray="3 5"
                  />
                  <XAxis
                    dataKey="label"
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={35}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [
                      `${value} ${config.unit}`,
                      config.label,
                    ]}
                  />
                  {typeof metric.baseline === "number" && (
                    <ReferenceLine
                      y={metric.baseline}
                      stroke="#b5a6f0"
                      strokeDasharray="5 4"
                    />
                  )}
                  <Line
                    dataKey="value"
                    name={config.label}
                    stroke={chartPalette[indicator]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="chart-empty">No values in the selected period.</div>
          )}
        </article>
        <article className="panel chart-panel">
          <div className="chart-heading">
            <h3>Sleep & fatigue in context</h3>
            <span>Separate units</span>
          </div>
          <p className="analytics-caption">
            Solid: sleep, hours (left) · dashed: fatigue, / 10 (right).
            Co-occurrence does not establish cause.
          </p>
          {hasPaired ? (
            <div
              className="insights-chart-canvas"
              role="img"
              aria-label={`${days}-day comparison of sleep hours on the left axis and fatigue scores on the right. Separate scales; not a combined clinical score.`}
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart
                  data={data}
                  margin={{ top: 15, right: 0, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="#2c3b50"
                    strokeDasharray="3 5"
                  />
                  <XAxis
                    dataKey="label"
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={35}
                  />
                  <YAxis
                    yAxisId="sleep"
                    domain={[0, 24]}
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                    width={34}
                  />
                  <YAxis
                    yAxisId="fatigue"
                    orientation="right"
                    domain={[0, 10]}
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    yAxisId="sleep"
                    name="Sleep (hours, left)"
                    dataKey="sleep"
                    stroke={chartPalette.sleep}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="fatigue"
                    name="Fatigue (/ 10, right)"
                    dataKey="fatigue"
                    stroke={chartPalette.fatigue}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={{ r: 3 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="chart-empty">
              No sleep or fatigue data in this period.
            </div>
          )}
        </article>
        <article className="panel chart-panel">
          <div className="chart-heading">
            <h3>Seven-day completeness</h3>
            <span>Days / 7</span>
          </div>
          <p className="analytics-caption">
            Counts describe availability, not accuracy or medical reliability.
          </p>
          <div
            className="insights-chart-canvas completeness-chart"
            role="img"
            aria-label={`Recorded ${report.quality.completeCells7} of ${report.quality.expectedCells7} possible indicator-day cells over seven days. Detailed counts are listed below.`}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={completeness}
                layout="vertical"
                margin={{ top: 5, right: 25, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="#2c3b50"
                  strokeDasharray="3 5"
                />
                <XAxis
                  type="number"
                  domain={[0, 7]}
                  allowDecimals={false}
                  tick={tickStyle}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={122}
                  tick={tickStyle}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`${value} of 7 days`, "Recorded"]}
                />
                <Bar
                  dataKey="complete"
                  fill="#79dfd5"
                  maxBarSize={13}
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey="complete"
                    position="right"
                    fill="#d8e8f2"
                    fontSize={10}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
      <details className="panel analytics-data-table">
        <summary>Accessible analytics data tables</summary>
        <div className="table-scroll">
          <table>
            <caption>
              Selected indicator and multi-indicator chart values · no
              interpolation
            </caption>
            <thead>
              <tr>
                <th scope="col">Mission date</th>
                <th scope="col">
                  {config.label} ({config.unit})
                </th>
                <th scope="col">Sleep (hours)</th>
                <th scope="col">Fatigue (/ 10)</th>
                <th scope="col">Source / submission</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.date}>
                  <th scope="row">{displayDate(row.date)}</th>
                  <td>
                    {indicator === "spo2" && spo2NeedsReview(row.record?.spo2)
                      ? spo2Label(row.record?.spo2)
                      : formatIndicatorValue(indicator, row.value)}
                  </td>
                  <td>{row.sleep ?? "Not recorded"}</td>
                  <td>{row.fatigue ?? "Not recorded"}</td>
                  <td>
                    {row.record
                      ? `${sourceLabel(row.record.source)} · ${displayTimestamp(row.record.recordedAt)}`
                      : "No check-in"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <table>
            <caption>
              Seven-day completeness; one most recently submitted record per
              date
            </caption>
            <thead>
              <tr>
                <th scope="col">Indicator</th>
                <th scope="col">Days recorded</th>
              </tr>
            </thead>
            <tbody>
              {completeness.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>{row.complete} / 7</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <div className="section-heading">
        <div>
          <h2>Observation timeline</h2>
          <p>
            Recomputed from records available by each date’s UTC cutoff. Counts
            are statistical descriptions, not risk levels or a stored clinical
            audit log.
          </p>
        </div>
      </div>
      <article className="panel chart-panel">
        <div
          className="insights-chart-canvas"
          role="img"
          aria-label="Historical counts of stable, changed and review-suggested observations. Exact dates, counts and titles are in the timeline below."
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={timeline.map((row) => ({
                ...row,
                label: displayDate(row.missionDate),
              }))}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <pattern
                  id={id}
                  patternUnits="userSpaceOnUse"
                  width="6"
                  height="6"
                >
                  <rect width="6" height="6" fill="#d4a76f" />
                  <path d="M0 0L6 6" stroke="#453825" strokeWidth="2" />
                </pattern>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="#2c3b50"
                strokeDasharray="3 5"
              />
              <XAxis dataKey="label" tick={tickStyle} minTickGap={30} />
              <YAxis allowDecimals={false} tick={tickStyle} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar
                dataKey="stable"
                name="Stable comparison"
                fill="#79dfd5"
                maxBarSize={15}
                isAnimationActive={false}
              />
              <Bar
                dataKey="change"
                name="Change observed"
                fill="#9cacf3"
                stroke="#d4dcff"
                maxBarSize={15}
                isAnimationActive={false}
              />
              <Bar
                dataKey="review"
                name="Review suggested (striped)"
                fill={`url(#${id})`}
                maxBarSize={15}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
      <details className="panel analytics-data-table">
        <summary>
          Expand {timeline.length} historical dates and supporting observation
          titles
        </summary>
        <ol className="insight-timeline">
          {timeline.length ? (
            timeline.map((frame) => (
              <li key={frame.missionDate}>
                <strong>{displayDate(frame.missionDate)}</strong>
                <span>
                  {frame.stable} stable · {frame.change} changed ·{" "}
                  {frame.review} review suggested
                  {frame.urgent ? " · urgent report takes priority" : ""}
                </span>
                <p>
                  {frame.titles.length
                    ? frame.titles.join("; ")
                    : frame.stable
                      ? "No change rule was triggered among the available comparisons. This is not a health assessment."
                      : "Insufficient information at this cutoff."}
                </p>
                <small>
                  As of {displayTimestamp(frame.asOf)} ·{" "}
                  {frame.evidenceIds.length} distinct supporting records
                </small>
              </li>
            ))
          ) : (
            <li>No historical observations in this period.</li>
          )}
        </ol>
      </details>
    </section>
  );
}
