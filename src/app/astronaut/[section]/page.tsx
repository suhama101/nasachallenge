import { notFound, redirect } from "next/navigation";
import { astronautAccess } from "@/lib/auth/access";
import { AccountUnavailable } from "@/components/account-unavailable";
import { AstronautWorkspace } from "@/components/astronaut-workspace";
import { ProfileForm } from "@/components/profile-form";
import {
  PersonalMonitoring,
  type PersonalSection,
} from "@/components/personal-health-workspace";
export default async function AstronautSection({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (
    ![
      "onboarding",
      "profile",
      "daily-health-check",
      "health-history",
      "health-insights",
    ].includes(section)
  )
    notFound();
  const access = await astronautAccess();
  if (access.kind !== "ready") return <AccountUnavailable kind={access.kind} />;
  const monitoring = [
    "daily-health-check",
    "health-history",
    "health-insights",
  ].includes(section);
  if (monitoring && !access.profile) redirect("/astronaut/onboarding");
  return (
    <AstronautWorkspace userId={access.user.id}>
      {monitoring && access.profile ? (
        <PersonalMonitoring
          userId={access.user.id}
          profile={access.profile}
          section={section as PersonalSection}
        />
      ) : (
        <section className="account-card">
          <p className="eyebrow">
            {section === "onboarding"
              ? "STEP 3 OF 3 - YOUR MISSION PROFILE"
              : "ASTRONAUT MODE"}
          </p>
          <h1>
            {access.profile
              ? "Your mission profile"
              : "Let's set up your mission"}
          </h1>
          <p className="account-intro">
            {access.profile
              ? "Review or update your details. Optional fields can be left blank."
              : "Add a few details to make this workspace yours. Your profile is saved only to your signed-in account."}
          </p>
          <p className="account-notice">
            Profile completion:{" "}
            {access.profile
              ? "Complete"
              : "Email confirmed - Profile still to do"}
          </p>
          <ProfileForm profile={access.profile} />
        </section>
      )}
    </AstronautWorkspace>
  );
}
