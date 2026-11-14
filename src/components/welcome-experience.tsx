import { ModeEntry } from "@/components/mode-entry";
import { LandingHero, HowItWorks } from "@/components/landing-experience";
export function WelcomeExperience() {
  return (
    <div className="account-wide landing-page">
      <LandingHero />
      <div className="mode-heading">
        <p className="eyebrow">TWO WAYS TO EXPLORE</p>
        <h2>Choose the space that’s right for you.</h2>
        <p>The same curiosity. Separate records.</p>
      </div>
      <ModeEntry showActions={false} />
      <HowItWorks />
    </div>
  );
}
