import { PageLayout, PageHeading } from "@/components/page-layout";
import { HealthDataBoundary } from "@/components/demo-status";
import { AssistantWorkspace } from "@/components/assistant-workspace";
export const metadata = { title: "AI Health Assistant" };
export default function AssistantPage() {
  return (
    <PageLayout>
      <PageHeading
        eyebrow="GROUNDED CREW SUPPORT"
        title="AI Health Assistant"
        description="Explore space-health research and understand selected demonstration records, with sources and visible boundaries."
      />
      <HealthDataBoundary>
        <AssistantWorkspace />
      </HealthDataBoundary>
    </PageLayout>
  );
}
