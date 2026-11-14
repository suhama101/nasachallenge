// The fictional mission uses UTC as its explicitly defined local calendar.
// The selected calendar date and the actual UTC submission instant remain independent.
export const MISSION_TIME_ZONE = "UTC";
export function missionToday(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
export function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function displayDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: MISSION_TIME_ZONE,
  }).format(new Date(`${date}T12:00:00Z`));
}
export function displayTimestamp(value: string): string {
  return (
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }).format(new Date(value)) + " UTC"
  );
}
