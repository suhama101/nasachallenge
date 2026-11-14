import { DocumentLink } from "@/components/document-link";
export function AccountUnavailable({ kind }: { kind: string }) {
  return (
    <section className="account-card" role="status">
      <p className="eyebrow">ASTRONAUT MODE</p>
      <h1>
        {kind === "configuration"
          ? "Your personal workspace is not connected yet"
          : "We could not open your workspace"}
      </h1>
      <p className="account-intro">
        {kind === "configuration"
          ? "Account access is awaiting setup. No fictional crew records have been loaded into this workspace."
          : "Please check your connection and try again. Your profile has not been replaced with demo data."}
      </p>
      <div className="account-actions">
        <DocumentLink href="/astronaut">Try again</DocumentLink>
        <DocumentLink href="/demo">
          Explore Demo without an account
        </DocumentLink>
      </div>
    </section>
  );
}
