"use client";
import { DocumentLink } from "@/components/document-link";

import { useEffect, useState } from "react";
import { browserAuthClient } from "@/lib/auth/browser";
import { AccountForm } from "./account-form";
import { accountDocumentId } from "@/lib/auth/transitions";

export function AstronautWorkspace({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const [connectionError, setConnectionError] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  useEffect(() => {
    let active = true;
    let checking = false;
    const leave = () => {
      if (active) window.location.replace("/auth/login?reason=session");
    };
    const check = async () => {
      if (checking || !active) return;
      checking = true;
      try {
        const response = await fetch("/auth/session", { cache: "no-store" });
        if (!active) return;
        if (response.status === 401) {
          leave();
          return;
        }
        if (!response.ok) throw new Error("connection");
        const session = await response.json();
        if (session.userId !== userId) {
          leave();
          return;
        }
        setConnectionError(false);
      } catch {
        if (active) setConnectionError(true);
      } finally {
        checking = false;
        if (active) setRechecking(false);
      }
    };
    const onPage = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setRechecking(true);
        void check();
      }
    };
    const client = browserAuthClient();
    const subscription = client?.auth.onAuthStateChange((event, session) => {
      if (
        event === "SIGNED_OUT" ||
        (session?.user.id && session.user.id !== userId)
      )
        leave();
    });
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("missionpulse-account")
        : null;
    if (channel)
      channel.onmessage = (event) => {
        if (event.data?.sender !== accountDocumentId) leave();
      };
    const timer = window.setInterval(() => void check(), 30_000);
    window.addEventListener("focus", check);
    window.addEventListener("pageshow", onPage);
    void check();
    return () => {
      active = false;
      window.clearInterval(timer);
      channel?.close();
      subscription?.data.subscription.unsubscribe();
      window.removeEventListener("focus", check);
      window.removeEventListener("pageshow", onPage);
    };
  }, [userId]);
  return (
    <div className="account-wide">
      <div className="astronaut-toolbar">
        <span className="demo-badge">Astronaut Mode · Personal workspace</span>
        <AccountForm operation="logout" configured />
      </div>
      <nav className="astronaut-navigation" aria-label="Astronaut navigation">
        <DocumentLink href="/astronaut">Mission Overview</DocumentLink>
        <DocumentLink href="/astronaut/daily-health-check">
          Daily Health Check
        </DocumentLink>
        <DocumentLink href="/astronaut/health-history">
          Health History
        </DocumentLink>
        <DocumentLink href="/astronaut/health-insights">
          Health Insights
        </DocumentLink>
        <DocumentLink href="/astronaut/profile">My profile</DocumentLink>
        <DocumentLink href="/demo">Explore Demo</DocumentLink>
      </nav>
      {rechecking ? (
        <p role="status" className="account-notice">
          Checking your session before opening your workspace…
        </p>
      ) : connectionError ? (
        <section role="alert" className="account-card">
          <h1>Your connection needs attention</h1>
          <p>
            We could not check your session. Your personal workspace is hidden
            until the connection returns.
          </p>
          <button onClick={() => window.location.reload()}>Try again</button>
        </section>
      ) : (
        children
      )}
    </div>
  );
}
