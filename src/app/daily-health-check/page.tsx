import type { Metadata } from "next";
import { PageLayout, PageHeading } from "@/components/page-layout";
import { DemoBanner, HealthDataBoundary } from "@/components/demo-status";
import { DailyHealthForm } from "@/components/daily-health-form";
export const metadata: Metadata = { title: "Daily Health Check" };
export default function DailyHealthCheck() {
  return (
    <PageLayout>
      <PageHeading
        eyebrow="CREW HEALTH / DAILY ROUTINE"
        title="Daily Health Check"
        description="Record a moment in your mission. Add measurements and the context around them."
      />
      <DemoBanner />
      <HealthDataBoundary>
        <DailyHealthForm />
      </HealthDataBoundary>
    </PageLayout>
  );
}
