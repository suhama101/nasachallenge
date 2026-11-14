// A provider outage/rate limit is not proof that the session has ended.
// Private data remains unavailable until verification succeeds.
export function isTemporaryAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { status, name } = error as { status?: number; name?: string };
  return (
    status === 0 ||
    status === 429 ||
    (typeof status === "number" && status >= 500) ||
    name === "AuthRetryableFetchError"
  );
}
