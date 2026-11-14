"use client";
import { ErrorState } from "@/components/states";
import { PageLayout } from "@/components/page-layout";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <PageLayout>
      <ErrorState reset={reset} />
    </PageLayout>
  );
}
