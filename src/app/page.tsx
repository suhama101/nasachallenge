import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  CircleCheck,
  Clock3,
  FlaskConical,
  Orbit,
  Sparkles,
  BookOpen,
  CalendarDays,
} from "lucide-react";
import { PageLayout, PageHeading } from "@/components/page-layout";
import { MetricCard } from "@/components/metric-card";
import { HealthCharts } from "@/components/health-charts";
import { ObservationCard } from "@/components/observation-card";
import { Button } from "@/components/ui/button";
import { mission, metrics, observations } from "@/lib/mock-data";
export default function Overview() {
  return (
    <PageLayout>
      <PageHeading
        eyebrow="MISSION CONTROL / CREW HEALTH"
        title="Mission Overview"
        description="A clearer view of your health. A little closer to home."
        action={
          <span className="phase-pill">
            <FlaskConical size={14} />
            Research demo <span>v0.1</span>
          </span>
        }
      />
      <section className="welcome-panel" aria-labelledby="welcome-title">
        <div className="welcome-content">
          <p className="eyebrow">
            <span className="status-dot" /> {mission.name.toUpperCase()}
          </p>
          <h2 id="welcome-title">
            Good morning, Alex<span>.</span>
          </h2>
          <p>Every check-in is a step toward understanding your journey.</p>
          <div className="welcome-meta">
            <span>
              <Orbit size={15} />
              {mission.station}
            </span>
            <span className="crew-id">
              CREW ID <strong>{mission.crewId}</strong>
            </span>
          </div>
        </div>
        <div className="orbital-art" aria-hidden="true">
          <div className="orbital-ring ring-one" />
          <div className="orbital-ring ring-two" />
          <div className="planet" />
          <span className="orbit-satellite">
            <Orbit size={23} />
          </span>
        </div>
        <div className="mission-day">
          <span>MISSION DAY</span>
          <p>
            {String(mission.day).padStart(3, "0")}
            <small>/ {mission.duration}</small>
          </p>
          <div
            className="mission-progress"
            role="progressbar"
            aria-label="Mission elapsed"
            aria-valuenow={mission.day}
            aria-valuemin={0}
            aria-valuemax={mission.duration}
          >
            <span
              style={{ width: `${(mission.day / mission.duration) * 100}%` }}
            />
          </div>
          <small>One day at a time. Always forward.</small>
        </div>
      </section>
      <div className="section-heading metrics-heading">
        <div>
          <h2>Latest measurements</h2>
        </div>
        <span className="subtle-label">
          <Clock3 size={13} />
          <time dateTime={mission.recordedAt}>
            14 Nov 2026 · {mission.displayTime}
          </time>
        </span>
      </div>
      <section
        className="metrics-grid"
        aria-label="Latest synthetic health measurements"
      >
        {metrics.map((m) => (
          <MetricCard metric={m} key={m.id} />
        ))}
      </section>
      <div className="checkin-strip">
        <span className="checkin-icon">
          <CircleCheck size={20} />
        </span>
        <div>
          <strong>Today’s demo check-in is recorded</strong>
          <p>
            Four synthetic measurements ·{" "}
            <time dateTime={mission.recordedAt}>{mission.displayTime}</time> ·
            No live recording in Phase 1
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/daily-health-check">
            About daily check-ins
            <ArrowRight size={15} />
          </Link>
        </Button>
      </div>
      <HealthCharts />
      <div className="bottom-grid">
        <section
          className="panel observations-panel"
          aria-labelledby="observations-title"
        >
          <div className="panel-title">
            <h2 id="observations-title">
              <Sparkles size={17} />
              Recent observations
            </h2>
            <span className="mini-label">ILLUSTRATIVE</span>
          </div>
          {observations.map((o) => (
            <ObservationCard key={o.kind} observation={o} />
          ))}
          <div className="observation-footer">
            Sample comparisons, not a clinical assessment.
            <Link href="/health-insights">
              About insights
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>
        <section
          className="panel knowledge-panel"
          aria-labelledby="knowledge-title"
        >
          <div className="panel-title">
            <h2 id="knowledge-title">
              <BookOpen size={17} />
              Life beyond Earth
            </h2>
          </div>
          <div className="knowledge-illustration" aria-hidden="true">
            <span className="window-grid" />
            <Orbit size={50} strokeWidth={1} />
            <span className="tiny-star star-one" />
            <span className="tiny-star star-two" />
          </div>
          <p className="eyebrow">SPACE HEALTH / SLEEP IN ORBIT</p>
          <h3>
            Sixteen sunrises.
            <br />
            One body clock.
          </h3>
          <p>
            ISS crews experience about 16 sunrises and sunsets each day. These
            changing light cues can disrupt the sleep-wake cycle.
          </p>
          <a
            className="text-link"
            href="https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/"
            target="_blank"
            rel="noreferrer"
          >
            Read NASA’s sleep research{" "}
            <span className="sr-only">(opens in a new tab)</span>
            <ArrowUpRight size={16} />
          </a>
        </section>
      </div>
      <div className="provenance">
        <FlaskConical size={15} />
        <p>
          <strong>Designed for exploration.</strong> All crew details,
          measurements and observations are fictional. This snapshot is fixed to{" "}
          {mission.displayDate}; it does not represent live telemetry.
        </p>
        <CalendarDays size={17} />
      </div>
    </PageLayout>
  );
}
