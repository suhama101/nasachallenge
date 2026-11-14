import { Heart, Moon } from "lucide-react";
import type { Observation } from "@/lib/mock-data";
export function ObservationCard({ observation }: { observation: Observation }) {
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
          Illustrative observation · 14 Nov 2026
        </span>
      </div>
    </article>
  );
}
