"use client";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { useInsights } from "./insights-provider";
import { scenarioDefinitions } from "@/lib/insights/scenarios";
export function DemoGuide() {
  const { select } = useInsights();
  return (
    <>
      <section
        className="panel demo-introduction"
        aria-labelledby="demo-purpose"
      >
        <p className="eyebrow">A THREE-MINUTE MISSION WALKTHROUGH</p>
        <h2 id="demo-purpose">
          From a daily record to an explainable observation.
        </h2>
        <p>
          MissionPulse helps a crew organize manually entered wellness records,
          compare changes with their own earlier readings, and find relevant
          space-health research. Alex Morgan and Asteria Expedition 07 are
          fictional. No account, sensor connection or API key is needed.
        </p>
        <Button asChild>
          <Link href="/daily-health-check" onClick={() => select("saved")}>
            <ClipboardCheck size={16} />
            Start the saved-record journey
            <ArrowRight size={16} />
          </Link>
        </Button>
        <p className="demo-preservation">
          <ShieldCheck size={16} />
          This guide adds no records and deletes nothing. Enter fictional
          measurements only. Your existing browser records stay saved.
        </p>
      </section>
      <ol className="demo-steps" aria-label="Mission demonstration steps">
        {[
          [
            "01",
            "Record",
            "/daily-health-check",
            "Enter a fictional check-in for today’s UTC mission date. Required fields start empty. Save once and read the dated confirmation.",
          ],
          [
            "02",
            "Review history",
            "/health-history",
            "Find the new entry and its source, units and submission time. Refresh to verify persistence; open the exact-value chart tables.",
          ],
          [
            "03",
            "Understand changes",
            "/health-insights",
            "Choose Saved local demo records. Inspect current versus earlier median, sample count, evidence and limitations. No statistical label establishes medical status.",
          ],
          [
            "04",
            "Ask & trace the evidence",
            "/ai-health-assistant",
            "Choose Saved browser demo, opt into measurements for one message, and ask “How has my sleep changed over the last seven days?” Compare the dated values with History.",
          ],
        ].map(([step, title, href, description]) => (
          <li className="panel demo-step" key={step}>
            <span>{step}</span>
            <h2>
              <Link href={href}>
                {title}
                <ArrowRight size={15} />
              </Link>
            </h2>
            <p>{description}</p>
          </li>
        ))}
      </ol>
      <div className="section-heading">
        <div>
          <h2>Explore the isolated mission scenarios</h2>
          <p>
            Twenty-one synthetic dates per scenario. Opening a preview changes
            the selected analysis dataset, never saved check-ins.
          </p>
        </div>
      </div>
      <div className="knowledge-grid demo-scenarios">
        {scenarioDefinitions.map((scenario) => (
          <article className="panel knowledge-card" key={scenario.id}>
            <p className="eyebrow">SYNTHETIC SCENARIO · NOT SAVED</p>
            <h2>{scenario.name}</h2>
            <p>{scenario.context}</p>
            <p>
              {scenario.description} Open Health Insights for the supporting
              chart, earlier baseline and explainable observation.
            </p>
            <Link
              className="demo-preview"
              href="/health-insights"
              onClick={() => select(scenario.id)}
            >
              Open scenario {scenario.name[0]}
              <ArrowRight size={15} />
            </Link>
            <Link
              className="scenario-knowledge"
              href={`/space-health-knowledge/${scenario.knowledgeTopic}`}
            >
              Related NASA research →
            </Link>
          </article>
        ))}
      </div>
      <section className="panel demo-boundaries">
        <h2>What you are seeing</h2>
        <dl>
          <div>
            <dt>Synthetic data</dt>
            <dd>
              Initial seed rows and scenarios are generated fictional examples,
              labeled by source.
            </dd>
          </div>
          <div>
            <dt>Recorded demo measurements</dt>
            <dd>
              Values you save are user-entered demo records. Analyses use those
              values, not simulated live telemetry or invented missing readings.
            </dd>
          </div>
          <div>
            <dt>Scientific context</dt>
            <dd>
              <Link href="/space-health-knowledge">The NASA/CSA library</Link>{" "}
              links to official research. These agencies have not approved or
              certified this software.
            </dd>
          </div>
          <div>
            <dt>Prototype boundaries</dt>
            <dd>
              Statistical rules and safety keywords are unvalidated. The
              assistant uses local curated answers without Groq; optional live
              use only selects approved statements. No diagnosis, treatment,
              dosimetry, authentication or crew medical protocol is connected.
            </dd>
          </div>
        </dl>
        <p>
          Use designated crew medical officers and established emergency
          procedures for urgent concerns. This demonstration does not assess
          severity or operational fitness.
        </p>
      </section>
    </>
  );
}
