import { PageLayout, PageHeading } from "@/components/page-layout";
import { DemoGuide } from "@/components/demo-guide";
export const metadata = { title: "Explore MissionPulse Demo" };
export default function DemoPage() {
  return (
    <PageLayout>
      <PageHeading
        eyebrow="MISSIONPULSE / GUIDED DEMONSTRATION"
        title="Explore MissionPulse Demo"
        description="A clear route through astronaut health monitoring: record, review, understand and verify the evidence."
      />
      <DemoGuide />
    </PageLayout>
  );
}
