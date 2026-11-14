import { ModeEntry } from "@/components/mode-entry";
export const metadata = { title: "Welcome" };
export default function Welcome() {
  return (
    <div className="account-wide">
      <p className="eyebrow">HUMAN HEALTH. BEYOND EARTH.</p>
      <h1>Your mission starts here.</h1>
      <p className="account-intro">
        Choose a personal workspace or take a guided tour with fictional data.
      </p>
      <ModeEntry />
    </div>
  );
}
