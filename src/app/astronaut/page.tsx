import { redirect } from "next/navigation";
import { astronautAccess } from "@/lib/auth/access";
import { AccountUnavailable } from "@/components/account-unavailable";
import { AstronautWorkspace } from "@/components/astronaut-workspace";
import { PersonalMonitoring } from "@/components/personal-health-workspace";
export default async function AstronautOverview() {
  const access = await astronautAccess();
  if (access.kind !== "ready") return <AccountUnavailable kind={access.kind} />;
  if (!access.profile) redirect("/astronaut/onboarding");
  return (
    <AstronautWorkspace userId={access.user.id}>
      <PersonalMonitoring
        userId={access.user.id}
        profile={access.profile}
        section="overview"
      />
    </AstronautWorkspace>
  );
}
