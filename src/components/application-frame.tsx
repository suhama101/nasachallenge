"use client";
import { DocumentLink } from "@/components/document-link";

import { usePathname } from "next/navigation";
import { AppShell } from "./app-shell";
import { HealthProvider } from "./health-provider";
import { InsightsProvider } from "./insights-provider";

// Personal/auth pages never mount demo storage, scenarios or assistant state.
export function ApplicationFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (
    path === "/" ||
    path === "/welcome" ||
    path === "/astronaut" ||
    path.startsWith("/astronaut/") ||
    path === "/auth" ||
    path.startsWith("/auth/")
  ) {
    return (
      <div className="account-site">
        <DocumentLink className="skip-link" href="#main-content">
          Skip to content
        </DocumentLink>
        <header className="account-header">
          <DocumentLink href="/welcome" className="brand">
            Mission<span>Pulse</span>
          </DocumentLink>
          <nav aria-label="Mode navigation">
            <DocumentLink href="/welcome">Choose mode</DocumentLink>
            <DocumentLink href="/demo">Explore Demo</DocumentLink>
          </nav>
        </header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="account-footer">
          Research prototype. Creating an account does not verify NASA
          employment or astronaut status. No clinical assessment is provided.
        </footer>
      </div>
    );
  }
  return (
    <HealthProvider>
      <InsightsProvider>
        <AppShell>{children}</AppShell>
      </InsightsProvider>
    </HealthProvider>
  );
}
