import { Heart, Moon, Droplets, Thermometer } from "lucide-react";
import type { HealthCheckIn } from "@/lib/health/validation";
import { displayTimestamp } from "@/lib/health/dates";
import { sourceLabel } from "@/lib/health/selectors";
import { spo2NeedsReview } from "@/lib/health/integrity";
const metrics = [
  {
    key: "heartRate",
    title: "Resting heart rate",
    unit: "bpm",
    tone: "cyan",
    icon: Heart,
  },
  {
    key: "sleep",
    title: "Sleep duration",
    unit: "hours",
    tone: "violet",
    icon: Moon,
  },
  {
    key: "spo2",
    title: "Oxygen saturation",
    unit: "% SpO₂",
    tone: "blue",
    icon: Droplets,
  },
  {
    key: "temperature",
    title: "Body temperature",
    unit: "°C",
    tone: "amber",
    icon: Thermometer,
  },
] as const;
export function LatestMeasurements({
  record,
}: {
  record: HealthCheckIn | null;
}) {
  return (
    <section
      className="metrics-grid"
      aria-label="Measurements from the most recent recorded check-in"
    >
      {metrics.map(({ key, title, unit, tone, icon: Icon }) => (
        <article key={key} className={`panel metric-card tone-${tone}`}>
          <div className="metric-top">
            <span className="metric-icon">
              <Icon size={18} />
            </span>
            <span className="mini-label">LATEST CHECK-IN</span>
          </div>
          <h3>{title}</h3>
          <p className="metric-value">
            {record?.[key] ?? "—"}
            <span>{unit}</span>
          </p>
          <p className="metric-note">
            {key === "spo2" && spo2NeedsReview(record?.spo2)
              ? `Needs review · original ${record?.spo2}% kept; excluded from calculations`
              : record?.[key] == null
                ? "Not recorded"
                : "User-entered or synthetic; not device telemetry"}
          </p>
          <div className="metric-source">
            {record ? (
              <>
                <time dateTime={record.recordedAt}>
                  {displayTimestamp(record.recordedAt)}
                </time>
                <span>{sourceLabel(record.source)}</span>
              </>
            ) : (
              <span>No saved check-ins</span>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
