import Link from "next/link";
import { DocumentLink } from "./document-link";
import {
  ArrowUpRight,
  BookOpen,
  ChartNoAxesCombined,
  ClipboardPlus,
  History,
  UserRound,
} from "lucide-react";

export function JourneyCards({ personal = false }: { personal?: boolean }) {
  const prefix = personal ? "/astronaut" : "";
  const cards = [
    {
      href: `${prefix}/daily-health-check`,
      icon: ClipboardPlus,
      title: "Record Today’s Health",
      action: "Start Daily Check-In",
      text: "A few measurements. A moment to reflect.",
    },
    {
      href: `${prefix}/health-history`,
      icon: History,
      title: "My Health History",
      action: "View My Records",
      text: personal
        ? "Your saved account entries, in one place."
        : "Your fictional entries, saved in this browser.",
    },
    {
      href: `${prefix}/health-insights`,
      icon: ChartNoAxesCombined,
      title: "Understand My Health",
      action: "See Health Trends",
      text: "Look at changes over time, with clear limits.",
    },
  ];
  return (
    <section
      className="journey-section"
      aria-label={
        personal ? "Your personal next steps" : "Explore your demo workspace"
      }
    >
      <div className="journey-heading">
        <div>
          <p className="eyebrow">WHERE WOULD YOU LIKE TO START?</p>
          <h2>{personal ? "Your next small step" : "Make yourself at home"}</h2>
        </div>
        <span>
          {personal ? "Personal cloud records" : "Demo only · fictional data"}
        </span>
      </div>
      <div className="journey-grid">
        {cards.map(({ href, icon: Icon, title, action, text }) => (
          <Link className="journey-card" href={href} key={href}>
            <Icon size={24} strokeWidth={1.6} />
            <h3>{title}</h3>
            <p>{text}</p>
            <span>
              {action}
              <ArrowUpRight size={17} />
            </span>
          </Link>
        ))}
      </div>
      <div className="journey-secondary">
        <DocumentLink href="/space-health-knowledge">
          <BookOpen size={17} />
          Space Health Guide{personal && " · public demo library"}
          <ArrowUpRight size={14} />
        </DocumentLink>
        <Link href={personal ? "/astronaut/profile" : "/demo"}>
          <UserRound size={17} />
          {personal ? "My Profile" : "Demo walkthrough"}
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </section>
  );
}
