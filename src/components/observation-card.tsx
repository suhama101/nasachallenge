import { Heart, Moon } from "lucide-react";
import type { Observation } from "@/lib/mock-data";
import { displayTimestamp } from "@/lib/health/dates";
export function ObservationCard({
  observation,
  recordedAt,
}: {
  observation: Observation;
  recordedAt?: string;
}) {
  const Icon = observation.kind === "heart" ? Heart : Moon;
  return (
    <article className="observation">
      <span className={`observation-icon ${observation.kind}`}>
        <Icon size={17} />
      </span>
      <div>
        <h3>{observation.title}</h3>
        <p>{observation.detail}</p>
        <span className="observation-meta">
          {recordedAt
            ? `Based on local records · Latest ${displayTimestamp(recordedAt)}`
            : "Local demonstration · No clinical assessment"}
        </span>
      </div>
    </article>
  );
}
