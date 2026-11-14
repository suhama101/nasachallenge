import type { Metadata } from "next";
import { PageHeading, PageLayout } from "@/components/page-layout";
import { DemoBanner, HealthDataBoundary } from "@/components/demo-status";
import { HealthInsights } from "@/components/health-insights";
export const metadata: Metadata = { title: "Health Insights" };
export default function HealthInsightsPage() {
  return (
    <PageLayout>
      <PageHeading
        eyebrow="CREW HEALTH / EXPLAINABLE MONITORING"
        title="Health Insights"
        description="Understand what changed, what supports it, and what remains uncertain."
      />
      <DemoBanner />
      <HealthDataBoundary>
        <HealthInsights />
      </HealthDataBoundary>
    </PageLayout>
  );
}
