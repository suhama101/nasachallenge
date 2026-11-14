import { PageLayout, PageHeading } from "@/components/page-layout";
import { KnowledgeCatalog } from "@/components/knowledge-catalog";
import { MeasurementReadingGuide, ResearchGuide } from "@/components/research-guide";
export const metadata = { title: "Space Health Knowledge" };
export default function KnowledgePage() {
  return (
    <PageLayout>
      <PageHeading
        eyebrow="RESEARCH LIBRARY"
        title="Space Health Knowledge"
        description="Understand the science behind monitoring a crew in space. Explore a curated collection of official NASA and Canadian Space Agency resources."
      />
      <aside className="demo-storage-banner">
        <p>
          <strong>Research context, with clear limits.</strong> These summaries
          and MissionPulse monitoring suggestions are educational, not
          NASA-approved medical instructions. No sensors, diagnosis or clinical
          protocol are connected. Sources were reviewed on 14 November 2026.
        </p>
      </aside>
      <MeasurementReadingGuide />
      <KnowledgeCatalog />
      <ResearchGuide />
    </PageLayout>
  );
}
