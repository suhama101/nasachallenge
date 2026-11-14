import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountForm } from "@/components/account-form";
import { authOrigin, readAuthConfig } from "@/lib/auth/config";
import { authClient } from "@/lib/auth/server";
import { unavailableMessage, type AuthOperation } from "@/lib/auth/service";
const screens: Record<
  string,
  { title: string; description: string; operation: AuthOperation }
> = {
  login: {
    title: "Welcome back",
    description:
      "Sign in to your personal Astronaut workspace. Your demo entries stay separate.",
    operation: "login",
  },
  signup: {
    title: "Create your account",
    description:
      "Step 1 of 3: create your account. Next, confirm your email and set up your mission profile.",
    operation: "signup",
  },
  "forgot-password": {
    title: "Reset your password",
    description:
      "Enter your email and we will send instructions if this address is eligible.",
    operation: "forgot-password",
  },
  "update-password": {
    title: "Choose a new password",
    description:
      "Use a unique password. After saving, sign in again with your new password.",
    operation: "update-password",
  },
  "verify-email": {
    title: "Check your email",
    description:
      "Step 2 of 3: open the verification link in your email, then finish your mission profile. Need a fresh link? Enter your email below.",
    operation: "resend",
  },
};
export const dynamic = "force-dynamic";
export default async function AuthScreen({
  params,
  searchParams,
}: {
  params: Promise<{ screen: string }>;
  searchParams: Promise<{ reason?: string }>;
}) {
  const { screen } = await params;
  const info = screens[screen];
  if (!info) notFound();
  const { reason } = await searchParams;
  let configured = !!readAuthConfig();
  const needsEmailLinks = [
    "signup",
    "forgot-password",
    "verify-email",
  ].includes(screen);
  const emailLinksReady = !!authOrigin();
  if (needsEmailLinks && !emailLinksReady) configured = false;
  let expired = false;
  if (screen === "update-password" && configured) {
    try {
      const client = await authClient();
      const result = await client!.auth.getUser();
      expired = !!result.error || !result.data.user?.email_confirmed_at;
    } catch {
      expired = true;
    }
    configured = !expired;
  }
  const notices: Record<string, string> = {
    session:
      "Please sign in to continue. Your previous session may have ended.",
    "signed-out": "You have signed out. Your demo records are unchanged.",
    "sign-out-failed":
      "We could not confirm sign out. Return to your workspace and retry before leaving this device.",
    "password-updated":
      "Your password has been updated. Sign in with your new password.",
    "link-expired":
      "That email link is invalid or has expired. Request a fresh verification or password reset link.",
  };
  return (
    <section className="account-card">
      <p className="eyebrow">ASTRONAUT MODE</p>
      <h1>{info.title}</h1>
      <p className="account-intro">{info.description}</p>
      {reason && notices[reason] && (
        <p className="account-notice" role="status">
          {notices[reason]}
        </p>
      )}
      {!readAuthConfig() && (
        <p className="account-notice" role="status">
          {unavailableMessage}
        </p>
      )}
      {readAuthConfig() && needsEmailLinks && !emailLinksReady && (
        <p className="account-notice" role="status">
          Account email links are not ready yet. Please try again after the site
          connection is completed, or explore the demo.
        </p>
      )}
      {expired && (
        <p role="alert" className="account-error">
          This session is unavailable or has expired. Request a new password
          reset link.
        </p>
      )}
      <AccountForm operation={info.operation} configured={configured} />
      <nav className="account-help" aria-label="Account help">
        <Link href="/auth/login">Sign In</Link>
        <Link href="/auth/signup">Create Account</Link>
        <Link href="/auth/forgot-password">Forgot password?</Link>
        <Link href="/auth/verify-email">Email verification help</Link>
      </nav>
      <p className="account-fine">
        Profiles are self-described research or simulation identities. Signup
        does not verify astronaut status or NASA employment.
      </p>
    </section>
  );
}
