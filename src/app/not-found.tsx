import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/page-layout";
export default function NotFound() {
  return (
    <PageLayout>
      <div className="panel empty-state">
        <span className="eyebrow">404 / OFF THE FLIGHT PATH</span>
        <h1>Page not found</h1>
        <p>This route isn’t part of the mission.</p>
        <Button asChild>
          <Link href="/">Return to Mission Overview</Link>
        </Button>
      </div>
    </PageLayout>
  );
}
