import { notFound } from "next/navigation";
import { Check, LockKeyhole } from "lucide-react";
import { modules } from "@/lib/mock-data";
import { PageLayout, PageHeading } from "@/components/page-layout";
import { EmptyState } from "@/components/states";
export function generateStaticParams() {
  return modules
    .filter(
      (m) =>
        m.slug !== "daily-health-check" &&
        m.slug !== "health-history" &&
        m.slug !== "health-insights",
    )
    .map((m) => ({ section: m.slug }));
}
export const dynamicParams = false;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const plannedModule = modules.find((m) => m.slug === section);
  return { title: plannedModule?.title ?? "Page not found" };
}
export default async function ModulePage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const plannedModule = modules.find((m) => m.slug === section);
  if (!plannedModule) notFound();
  return (
    <PageLayout>
      <PageHeading
        eyebrow={plannedModule.eyebrow}
        title={plannedModule.title}
        description={plannedModule.description}
      />
      <EmptyState
        title="The next chapter is taking shape."
        description="This is a planned module. Check-ins, history and explainable monitoring are available; this feature is not available yet."
      >
        <div className="planned-features">
          <h3>WHAT’S PLANNED</h3>
          <ul>
            {plannedModule.planned.map((feature) => (
              <li key={feature}>
                <Check size={16} />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <p className="privacy-note">
          <LockKeyhole size={15} />
          This module collects no information and sends nothing to an AI
          service.
        </p>
      </EmptyState>
    </PageLayout>
  );
}
