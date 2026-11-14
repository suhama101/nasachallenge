import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PageLayout, PageHeading } from "@/components/page-layout";
import { getKnowledgeEntry, knowledgeEntries } from "@/lib/knowledge/content";
export const dynamicParams = false;
export function generateStaticParams() {
  return knowledgeEntries.map((entry) => ({ topic: entry.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  return {
    title: getKnowledgeEntry((await params).topic)?.title ?? "Topic not found",
  };
}
export default async function TopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const entry = getKnowledgeEntry((await params).topic);
  if (!entry) notFound();
  return (
    <PageLayout>
      <Link className="knowledge-back" href="/space-health-knowledge">
        <ArrowLeft size={16} />
        All knowledge topics
      </Link>
      <PageHeading
        eyebrow={entry.topic.toUpperCase()}
        title={entry.title}
        description={entry.summary}
      />
      <div className="knowledge-detail-grid">
        <article className="panel knowledge-detail">
          <h2>Why might astronauts monitor this?</h2>
          <p>{entry.whyItMatters}</p>
          <h2>Which measurements or context are relevant?</h2>
          <ul>
            {entry.indicators.map((indicator) => (
              <li key={indicator}>{indicator}</li>
            ))}
          </ul>
          <h2>A non-diagnostic next step</h2>
          <p>{entry.monitoring}</p>
          <h2>Scientific limitations</h2>
          <p>{entry.limitations}</p>
          <p className="knowledge-caution">
            Educational research does not establish a cause for a personal
            reading. MissionPulse is not NASA-certified or clinically approved.
          </p>
        </article>
        <aside className="panel knowledge-detail">
          <p className="eyebrow">OFFICIAL SOURCE</p>
          <h2>{entry.sourceTitle}</h2>
          <p>{entry.organization}</p>
          <a
            className="knowledge-source"
            href={entry.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open official resource <ExternalLink size={15} />
          </a>
          <dl>
            <dt>Last source review</dt>
            <dd>{entry.lastVerified}</dd>
            <dt>Content version</dt>
            <dd>{entry.version}</dd>
            <dt>Related hazards</dt>
            <dd>{entry.hazards.join(" · ")}</dd>
          </dl>
          <Link href="/ai-health-assistant">Ask a space-health question →</Link>
        </aside>
      </div>
    </PageLayout>
  );
}
