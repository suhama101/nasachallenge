import { DocumentLink } from "@/components/document-link";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export function ModeEntry({
  compact = false,
  showActions = true,
}: {
  compact?: boolean;
  showActions?: boolean;
}) {
  return (
    <section
      className={`mode-entry ${compact ? "compact" : ""}`}
      aria-label="Choose your MissionPulse mode"
    >
      <div className="mode-card">
        <p className="eyebrow">YOUR OWN WORKSPACE</p>
        <h2>Astronaut Mode</h2>
        <p>
          Create an account, confirm your email, and set up your mission
          profile. Record check-ins, review your personal history, and explore
          descriptive insights from your own entries.
        </p>
        {showActions && (
          <div className="account-actions">
            <Button asChild>
              <DocumentLink href="/auth/login">Sign In</DocumentLink>
            </Button>
            <Button asChild variant="outline">
              <DocumentLink href="/auth/signup">Create Account</DocumentLink>
            </Button>
          </div>
        )}
      </div>
      <div className="mode-card">
        <p className="eyebrow">NO ACCOUNT REQUIRED</p>
        <h2>Explore Demo</h2>
        <p>
          Try fictional check-ins, insights, scenarios, and research. Demo
          entries stay in this browser and are never added to an account.
        </p>
        {showActions && (
          <Button asChild variant="outline">
            <Link href="/demo">Explore Demo</Link>
          </Button>
        )}
      </div>
    </section>
  );
}
