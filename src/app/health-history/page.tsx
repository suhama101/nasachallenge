import type { Metadata } from "next";
import { PageLayout, PageHeading } from "@/components/page-layout";
import { DemoBanner, HealthDataBoundary } from "@/components/demo-status";
import { HealthHistory } from "@/components/health-history";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export const metadata: Metadata = { title: "Health History" };
export default function HistoryPage() {
  return (
    <PageLayout>
      <PageHeading
        eyebrow="CREW HEALTH / YOUR RECORD"
        title="Health History"
        description="Every entry, in context. Explore your mission’s health record."
        action={
          <Button asChild>
            <Link href="/daily-health-check">Record a check-in</Link>
          </Button>
        }
      />
      <DemoBanner />
      <HealthDataBoundary>
        <HealthHistory />
      </HealthDataBoundary>
    </PageLayout>
  );
}
