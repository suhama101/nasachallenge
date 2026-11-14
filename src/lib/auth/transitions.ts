// Per-document marker only; never a credential or persisted user identifier.
export const accountDocumentId =
  typeof window === "undefined" ? "server" : crypto.randomUUID();
export function notifyAccountTransition() {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel("missionpulse-account");
  channel.postMessage({ sender: accountDocumentId });
  channel.close();
}
