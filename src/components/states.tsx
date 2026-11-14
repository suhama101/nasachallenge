import Link from "next/link";
import { ArrowLeft, CircleAlert, Orbit } from "lucide-react";
import { Button } from "@/components/ui/button";
export function LoadingState() {
  return (
    <div className="loading-state" role="status" aria-label="Loading page">
      <span className="sr-only">Loading MissionPulse…</span>
      <div className="skeleton h-8 w-60" />
      <div className="skeleton mt-4 h-4 w-80 max-w-full" />
      <div className="metrics-grid mt-8">
        {[1, 2, 3, 4].map((i) => (
          <div className="skeleton h-48" key={i} />
        ))}
      </div>
      <div className="skeleton mt-6 h-80" />
    </div>
  );
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="panel empty-state">
      <span className="empty-icon">
        <Orbit size={30} />
      </span>
      <span className="phase-tag">PLANNED MODULE · PHASE 02+</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
      <Button variant="outline" asChild>
        <Link href="/">
          <ArrowLeft size={16} />
          Back to Mission Overview
        </Link>
      </Button>
    </section>
  );
}
export function ErrorState({ reset }: { reset: () => void }) {
  return (
    <section className="panel empty-state" role="alert">
      <CircleAlert size={32} />
      <h2>This view couldn’t be loaded</h2>
      <p>Try loading it again. Your demonstration data is unchanged.</p>
      <Button onClick={reset}>Try again</Button>
    </section>
  );
}
