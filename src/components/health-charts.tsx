"use client";
import { useId, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Heart,
  Moon,
  Thermometer,
  Droplets,
  Activity,
  ChevronDown,
} from "lucide-react";
import type { HealthCheckIn } from "@/lib/health/validation";
import {
  average,
  chartRecords,
  filterRecords,
  measurement,
  sourceLabel,
} from "@/lib/health/selectors";
import { displayDate, displayTimestamp, shiftDate } from "@/lib/health/dates";

type ChartKind =
  "heartRate" | "sleep" | "temperature" | "spo2" | "bloodPressure";
const chartConfig = {
  heartRate: {
    title: "Resting heart rate",
    unit: "bpm",
    color: "#5adbd3",
    icon: Heart,
  },
  sleep: {
    title: "Sleep duration",
    unit: "hours",
    color: "#aba0ef",
    icon: Moon,
  },
  temperature: {
    title: "Body temperature",
    unit: "°C",
    color: "#e5bd8c",
    icon: Thermometer,
  },
  spo2: {
    title: "Oxygen saturation",
    unit: "% SpO₂",
    color: "#8bbcff",
    icon: Droplets,
  },
  bloodPressure: {
    title: "Blood pressure",
    unit: "mmHg",
    color: "#5adbd3",
    icon: Activity,
  },
};
const tooltipStyle = {
  background: "#121e30",
  border: "1px solid #42536b",
  borderRadius: 8,
  color: "#eef4ff",
};
export function TrendChart({
  records,
  kind,
}: {
  records: HealthCheckIn[];
  kind: ChartKind;
}) {
  const id = useId();
  const config = chartConfig[kind];
  const Icon = config.icon;
  const data = chartRecords(records).map((row) => ({
    ...row,
    label: displayDate(row.missionDate),
  }));
  const hasValues = data.some((row) =>
    kind === "bloodPressure"
      ? row.systolic !== null || row.diastolic !== null
      : row[kind] !== null,
  );
  const mean = kind === "bloodPressure" ? null : average(records, kind);
  const keys = kind === "bloodPressure" ? ["systolic", "diastolic"] : [kind];
  const name = (key: string) =>
    key === "systolic"
      ? "Systolic"
      : key === "diastolic"
        ? "Diastolic"
        : config.title;
  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="#263243" strokeDasharray="3 5" />
      <XAxis
        dataKey="label"
        tickLine={false}
        axisLine={false}
        tick={{ fill: "#a7b6ca", fontSize: 10 }}
        minTickGap={25}
        dy={8}
      />
      <YAxis
        domain={
          kind === "spo2"
            ? [0, 100]
            : kind === "sleep"
              ? [0, 24]
              : ["auto", "auto"]
        }
        axisLine={false}
        tickLine={false}
        tick={{ fill: "#a7b6ca", fontSize: 10 }}
        width={43}
      />
      <Tooltip
        contentStyle={tooltipStyle}
        formatter={(value, key) => [
          `${value} ${config.unit}`,
          name(String(key)),
        ]}
        labelFormatter={(_, payload) => {
          const row = payload[0]?.payload as HealthCheckIn | undefined;
          return row
            ? `${displayDate(row.missionDate)} · ${displayTimestamp(row.recordedAt)} · ${sourceLabel(row.source)}`
            : "";
        }}
      />
    </>
  );
  return (
    <article className="panel chart-panel">
      <div className="chart-heading">
        <h3>
          <Icon size={16} style={{ color: config.color }} />
          {config.title}
        </h3>
        <span>{config.unit}</span>
      </div>
      <p className="chart-summary">
        {kind === "bloodPressure" ? "SYS / DIA" : (mean ?? "—")}
        <span>
          {kind === "bloodPressure" ? "two series" : `${config.unit} average`}
        </span>
        <small>Selected records · missing values excluded</small>
      </p>
      {hasValues ? (
        <div
          className="chart-canvas"
          role="img"
          aria-label={`${config.title}, ${records.length} check-ins by selected mission date. ${mean ? `Mean ${mean} ${config.unit}.` : ""} Missing values are gaps. Exact values are in the accessible data table below.`}
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            {kind === "sleep" ? (
              <BarChart
                data={data}
                margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
              >
                {axes}
                <Bar
                  dataKey="sleep"
                  fill={config.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                  isAnimationActive={false}
                />
              </BarChart>
            ) : kind === "bloodPressure" ? (
              <LineChart
                data={data}
                margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
              >
                {axes}
                <Line
                  dataKey="systolic"
                  stroke="#5adbd3"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="diastolic"
                  stroke="#aba0ef"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            ) : (
              <AreaChart
                data={data}
                margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
              >
                {axes}
                <defs>
                  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={config.color}
                      stopOpacity={0.23}
                    />
                    <stop
                      offset="100%"
                      stopColor={config.color}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="linear"
                  dataKey={kind}
                  stroke={config.color}
                  strokeWidth={2.5}
                  fill={`url(#${id})`}
                  dot={{ r: 3, strokeWidth: 2 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="chart-empty">
          <p>No {config.title.toLowerCase()} values in this date range.</p>
        </div>
      )}
      <p className="chart-source">
        Synthetic and user-entered demo records · mission dates (UTC)
        {kind === "bloodPressure" && " · Cyan: systolic / Violet: diastolic"}
      </p>
      <details className="data-details chart-table">
        <summary>View {config.title.toLowerCase()} data table</summary>
        <div className="table-scroll">
          <table>
            <caption>
              {config.title} · exact stored values; each row is a separate
              check-in
            </caption>
            <thead>
              <tr>
                <th scope="col">Mission date (UTC)</th>
                <th scope="col">Recorded at (UTC)</th>
                {keys.map((key) => (
                  <th key={key} scope="col">
                    {name(key)} ({config.unit})
                  </th>
                ))}
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{displayDate(row.missionDate)}</th>
                  <td>{displayTimestamp(row.recordedAt)}</td>
                  {keys.map((key) => (
                    <td key={key}>
                      {measurement(
                        row[
                          key as
                            | "heartRate"
                            | "systolic"
                            | "diastolic"
                            | "sleep"
                            | "temperature"
                            | "spo2"
                        ],
                        config.unit,
                      )}
                    </td>
                  ))}
                  <td>{sourceLabel(row.source)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </article>
  );
}
export function HealthCharts({
  records,
  today,
  full = false,
}: {
  records: HealthCheckIn[];
  today: string;
  full?: boolean;
}) {
  const [days, setDays] = useState(14);
  const selected = full
    ? records
    : filterRecords(records, shiftDate(today, 1 - days), today);
  return (
    <section aria-labelledby="trends-title">
      <div className="section-heading">
        <div>
          <h2 id="trends-title">Your health, over time</h2>
          <p>
            {full
              ? "Trends follow the selected mission-date filter."
              : "Mission dates through today (UTC). Each point is a check-in."}{" "}
            Missing values are never filled in.
          </p>
        </div>
        {!full && (
          <div className="select-wrap">
            <label htmlFor="trend-range" className="sr-only">
              Chart date range
            </label>
            <select
              id="trend-range"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <ChevronDown size={14} />
          </div>
        )}
      </div>
      <div className="charts-grid">
        <TrendChart kind="heartRate" records={selected} />
        <TrendChart kind="sleep" records={selected} />
        {full && (
          <>
            <TrendChart kind="temperature" records={selected} />
            <TrendChart kind="spo2" records={selected} />
            <TrendChart kind="bloodPressure" records={selected} />
          </>
        )}
      </div>
    </section>
  );
}
