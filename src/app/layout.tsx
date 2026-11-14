import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { HealthProvider } from "@/components/health-provider";
import { InsightsProvider } from "@/components/insights-provider";
export const metadata: Metadata = {
  title: {
    default: "Mission Overview | MissionPulse",
    template: "%s | MissionPulse",
  },
  description:
    "MissionPulse: an astronaut health research demonstration with local demo check-ins and history for NASA Space Apps Challenge 2026.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <HealthProvider>
          <InsightsProvider>
            <AppShell>{children}</AppShell>
          </InsightsProvider>
        </HealthProvider>
      </body>
    </html>
  );
}
