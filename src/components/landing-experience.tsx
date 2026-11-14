import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  ClipboardPlus,
  History,
  Orbit,
} from "lucide-react";
import { DocumentLink } from "./document-link";
import { Button } from "./ui/button";

export function LandingHero({ compact = false }: { compact?: boolean }) {
  const Heading = compact ? "h2" : "h1";
  return (
    <section
      className={`landing-hero ${compact ? "landing-hero-compact" : ""}`}
      aria-label="Welcome to MissionPulse"
    >
      <div className="landing-copy">
        <p className="eyebrow">HUMAN HEALTH. A NEW PERSPECTIVE.</p>
        <Heading>
          Your Health Companion,
          <br /> <em>Beyond Earth.</em>
        </Heading>
        <p className="landing-description">
          Explore astronaut health monitoring: record daily measurements, see
          your personal trends, and learn how spaceflight affects human health.
        </p>
        <p className="landing-audience">
          Built for curious explorers, students, and space-health researchers.
        </p>
        <div className="landing-actions">
          <Button asChild>
            <Link href="/demo">
              Try Interactive Demo <ArrowRight size={17} />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <DocumentLink href="/auth/signup">Create Account</DocumentLink>
          </Button>
          <DocumentLink className="landing-signin" href="/auth/login">
            Sign In <ArrowRight size={15} />
          </DocumentLink>
        </div>
        <p className="landing-disclaimer">
          A research / hackathon prototype. Not an operational NASA healthcare
          system, diagnosis, or emergency service. No NASA endorsement.
        </p>
      </div>
      {!compact && (
        <div className="landing-art" aria-hidden="true">
          <div className="landing-orbit orbit-a" />
          <div className="landing-orbit orbit-b" />
          <div className="landing-earth">
            <Orbit size={52} strokeWidth={1} />
          </div>
          <div className="landing-art-label">
            MISSIONPULSE / HUMAN EXPLORATION
          </div>
          <div className="landing-preview">
            <span className="preview-icon">
              <ClipboardPlus size={22} />
            </span>
            <div>
              <strong>
                A little reflection.
                <br />A wider perspective.
              </strong>
              <p>Record. Reflect. Explore.</p>
            </div>
          </div>
          <span className="landing-art-caption">
            Concept illustration · no live telemetry
          </span>
        </div>
      )}
    </section>
  );
}

const steps = [
  {
    icon: ClipboardPlus,
    title: "Record your health",
    text: "Enter a daily check-in yourself. Clear labels, units, and optional fields help you get started.",
  },
  {
    icon: History,
    title: "Explore your history",
    text: "Find saved entries and revisit what you recorded. Demo stays in your browser; personal records go to your account.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Understand your trends",
    text: "Compare entries over time. One measurement is a starting point, not a trend or a diagnosis.",
  },
  {
    icon: BookOpen,
    title: "Learn from NASA research",
    text: "Discover spaceflight hazards and follow links to original NASA and Canadian Space Agency sources.",
  },
];
export function HowItWorks() {
  return (
    <section className="how-it-works" aria-labelledby="how-title">
      <div className="landing-section-heading">
        <div>
          <p className="eyebrow">SMALL STEPS. A CLEARER PICTURE.</p>
          <h2 id="how-title">How it works</h2>
        </div>
        <p>
          No spaceflight experience needed.
          <br />
          Start with the demo, at your own pace.
        </p>
      </div>
      <ol className="how-grid">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <li key={title}>
            <div className="how-step">
              <Icon size={24} strokeWidth={1.6} />
              <span>0{index + 1}</span>
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
          </li>
        ))}
      </ol>
      <Link href="/space-health-knowledge" className="research-text-link">
        Explore the Space Health Guide <ArrowRight size={16} />
      </Link>
    </section>
  );
}
