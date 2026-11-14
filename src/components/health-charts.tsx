"use client";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Heart, Moon, ChevronDown } from "lucide-react";
import { trends, mission } from "@/lib/mock-data";
export function HealthCharts() {
  const [days, setDays] = useState(7);
  const data = trends.slice(-days);
  const heartAverage = (
    data.reduce((s, p) => s + p.heartRate, 0) / data.length
  ).toFixed(1);
  const sleepAverage = (
    data.reduce((s, p) => s + p.sleep, 0) / data.length
  ).toFixed(1);
  return (
    <section aria-labelledby="trends-title">
      <div className="section-heading">
        <div>
          <h2 id="trends-title">Your health, over time</h2>
          <p>A little perspective on your daily measurements.</p>
        </div>
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
          </select>
          <ChevronDown size={14} />
        </div>
      </div>
      <div className="charts-grid">
        <article className="panel chart-panel">
          <div className="chart-heading">
            <h3>
              <Heart size={16} className="text-cyan-300" />
              Resting heart rate
            </h3>
            <span>7:30 UTC daily</span>
          </div>
          <p className="chart-summary">
            {heartAverage}
            <span>bpm average</span>
            <small>Selected period</small>
          </p>
          <div
            className="chart-canvas"
            role="img"
            aria-label={`Resting heart rate over ${days} days. Average ${heartAverage} beats per minute. Exact values in the table below.`}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart
                data={data}
                margin={{ top: 10, right: 8, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="heart-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#53d6ce" stopOpacity={0.23} />
                    <stop offset="100%" stopColor="#53d6ce" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="#263243"
                  strokeDasharray="3 5"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#98a7bb", fontSize: 11 }}
                  dy={9}
                  minTickGap={20}
                />
                <YAxis
                  domain={[55, 75]}
                  ticks={[55, 60, 65, 70, 75]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#98a7bb", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#121e30",
                    border: "1px solid #42536b",
                    borderRadius: 8,
                    color: "#eef4ff",
                  }}
                  formatter={(v) => [`${v} bpm`, "Resting heart rate"]}
                />
                <Area
                  type="monotone"
                  dataKey="heartRate"
                  stroke="#5adbd3"
                  strokeWidth={2.5}
                  fill="url(#heart-fill)"
                  dot={{ r: 3, fill: "#111e2c", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="chart-source">
            {mission.source} · {data[0].label}–14, 2026 · bpm
          </p>
        </article>
        <article className="panel chart-panel">
          <div className="chart-heading">
            <h3>
              <Moon size={16} className="text-violet-300" />
              Sleep duration
            </h3>
            <span>Logged 07:30 UTC daily</span>
          </div>
          <p className="chart-summary">
            {sleepAverage}
            <span>hours average</span>
            <small>Selected period</small>
          </p>
          <div
            className="chart-canvas"
            role="img"
            aria-label={`Sleep over ${days} days. Average ${sleepAverage} hours. Exact values in the table below.`}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={data}
                margin={{ top: 10, right: 8, left: -25, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#263243"
                  strokeDasharray="3 5"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#98a7bb", fontSize: 11 }}
                  dy={9}
                  minTickGap={20}
                />
                <YAxis
                  domain={[0, 10]}
                  ticks={[0, 2, 4, 6, 8, 10]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#98a7bb", fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: "#27314a" }}
                  contentStyle={{
                    background: "#121e30",
                    border: "1px solid #42536b",
                    borderRadius: 8,
                    color: "#eef4ff",
                  }}
                  formatter={(v) => [`${v} hours`, "Sleep duration"]}
                />
                <Bar
                  dataKey="sleep"
                  fill="#9d94e8"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="chart-source">
            {mission.source} · {data[0].label}–14, 2026 · hours
          </p>
        </article>
      </div>
      <details className="data-details">
        <summary>
          View chart data as a table <span>Accessible data view</span>
        </summary>
        <div className="table-scroll">
          <table>
            <caption>
              Synthetic measurements · logged at 07:30 UTC each day
            </caption>
            <thead>
              <tr>
                <th scope="col">Date (UTC)</th>
                <th scope="col">Resting heart rate (bpm)</th>
                <th scope="col">Sleep duration (hours)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.date}>
                  <th scope="row">{p.date}</th>
                  <td>{p.heartRate}</td>
                  <td>{p.sleep.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
