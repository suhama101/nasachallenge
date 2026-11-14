import {
  Heart,
  Moon,
  Droplets,
  Thermometer,
  type LucideIcon,
} from "lucide-react";
import { mission, type Metric } from "@/lib/mock-data";
const icons: Record<string, LucideIcon> = {
  heart: Heart,
  sleep: Moon,
  oxygen: Droplets,
  temperature: Thermometer,
};
export function MetricCard({ metric }: { metric: Metric }) {
  const Icon = icons[metric.id];
  return (
    <article className={`panel metric-card tone-${metric.color}`}>
      <div className="metric-top">
        <span className="metric-icon">
          <Icon size={18} />
        </span>
        <span className="mini-label">LATEST RECORD</span>
      </div>
      <h3>{metric.label}</h3>
      <p className="metric-value">
        {metric.value}
        <span>{metric.unit}</span>
      </p>
      <p className="metric-note">{metric.note}</p>
      <div className="metric-source">
        <time dateTime={mission.recordedAt}>
          {mission.displayTime} · 14 Nov
        </time>
        <span>Synthetic demo</span>
      </div>
    </article>
  );
}
