import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
export const metadata: Metadata = {
  title: {
    default: "Mission Overview | MissionPulse",
    template: "%s | MissionPulse",
  },
  description:
    "MissionPulse: an astronaut health research demonstration using synthetic data. Phase 1 frontend for NASA Space Apps Challenge 2026.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
