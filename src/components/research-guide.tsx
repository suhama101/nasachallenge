import { ArrowUpRight, BookOpen } from "lucide-react";
const sources = [
  {
    title: "Five Hazards of Human Spaceflight",
    org: "NASA",
    href: "https://www.nasa.gov/hrp/hazards/",
    text: "The big picture: radiation, isolation, distance, altered gravity, and closed environments.",
  },
  {
    title: "Risks of Human Spaceflight",
    org: "NASA",
    href: "https://www.nasa.gov/hrp/risks/",
    text: "Explore the risks human research aims to understand and reduce.",
  },
  {
    title: "Ongoing Human Research Program Research",
    org: "NASA",
    href: "https://www.nasa.gov/hrp/research/",
    text: "Discover human research for exploration. This address redirects to the Human Research Program overview.",
  },
  {
    title: "Monitoring Radiation for Astronaut Health",
    org: "CSA",
    href: "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp",
    text: "Learn about radiation monitoring research. A wellness check-in cannot measure radiation dose.",
  },
  {
    title: "Why Do We Conduct Science Experiments in Space?",
    org: "CSA",
    href: "https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp",
    text: "See how research in space supports exploration and knowledge on Earth.",
  },
];
export function ResearchGuide() {
  return (
    <section className="research-guide" aria-labelledby="research-guide-title">
      <div className="landing-section-heading">
        <div>
          <p className="eyebrow">CURIOUS ABOUT THE SCIENCE?</p>
          <h2 id="research-guide-title">Start with the original sources.</h2>
        </div>
        <BookOpen size={28} strokeWidth={1.5} />
      </div>
      <p className="research-intro">
        Five challenge resources, in plain sight. Open any source to explore the
        research behind the guide; these are educational resources, not personal
        medical instructions.
      </p>
      <div className="research-source-grid">
        {sources.map((source, i) => (
          <a
            href={source.href}
            target="_blank"
            rel="noopener noreferrer"
            key={source.href}
          >
            <span className="source-index">
              0{i + 1} / {source.org}
              <ArrowUpRight size={17} />
            </span>
            <h3>{source.title}</h3>
            <p>{source.text}</p>
            <span className="source-open">
              Read original source · opens a new tab
            </span>
          </a>
        ))}
      </div>
      <div className="research-limit">
        <strong>When should I seek medical support?</strong>
        <p>
          These sources do not provide individual measurement thresholds or a
          rule for when to contact a flight surgeon. A statistical change alone
          cannot establish an emergency. For urgent symptoms, use established
          crew medical procedures or qualified medical support. This prototype
          cannot provide emergency response.
        </p>
      </div>
    </section>
  );
}

export function MeasurementReadingGuide() {
  return (
    <section className="reading-guide" aria-labelledby="reading-guide-title">
      <h2 id="reading-guide-title">
        A measurement is a clue, not a conclusion.
      </h2>
      <div className="reading-guide-grid">
        <div>
          <strong>What am I recording?</strong>
          <p>
            Heart rate is beats per minute; sleep is hours; SpO₂ is a reported
            oxygen saturation percentage; temperature is degrees Celsius.
            Wellness entries describe how you feel.
          </p>
        </div>
        <div>
          <strong>What could it tell me?</strong>
          <p>
            Use repeated entries and their context to discuss changes. Missing
            values stay “Not recorded”; historical readings marked “Needs
            review” are excluded from calculations.
          </p>
        </div>
        <div>
          <strong>Where can I learn more?</strong>
          <p>
            Search below for a measurement or hazard. Each topic explains why it
            matters, its limits, and the exact NASA or CSA source. Research
            context does not establish the cause of your reading.
          </p>
        </div>
      </div>
    </section>
  );
}
