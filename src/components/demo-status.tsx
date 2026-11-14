"use client";
import { useState } from "react";
import { AlertDialog } from "radix-ui";
import { Database, Trash2 } from "lucide-react";
import { useHealth } from "./health-provider";
import { LoadingState } from "./states";
import { Button } from "./ui/button";

export function DemoBanner() {
  return (
    <aside className="demo-storage-banner">
      <Database size={18} />
      <p>
        <strong>Local demo · fictional crew member Alex Morgan.</strong>{" "}
        Synthetic seed records and your user-entered demo readings stay in this
        browser’s IndexedDB. Assistant sharing requires separate explicit
        consent. Nothing is measured automatically or uploaded to Supabase. Use
        fictional values only. Mission-local dates use UTC.
      </p>
    </aside>
  );
}
export function HealthDataBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, error, refresh } = useHealth();
  if (loading) return <LoadingState />;
  if (error)
    return (
      <section className="panel storage-error" role="alert">
        <h2>Browser storage needs attention</h2>
        <p>{error}</p>
        <Button variant="outline" onClick={() => void refresh()}>
          Retry loading
        </Button>
      </section>
    );
  return children;
}
export function ResetDemoData() {
  const { reset, records } = useHealth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await reset();
      setOpen(false);
      setMessage(
        "All local demo records were removed. The database will stay empty until you save a new check-in.",
      );
    } catch {
      setError(
        "Could not reset browser storage. No successful reset has been confirmed; please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="reset-demo">
      <div>
        <h2>Manage this browser’s demo</h2>
        <p>
          Reset deletes synthetic and user-entered demo check-ins. It does not
          affect other browsers or real accounts.
        </p>
        {message && <p role="status">{message}</p>}
      </div>
      <AlertDialog.Root
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <AlertDialog.Trigger asChild>
          <Button variant="outline" disabled={!records.length}>
            <Trash2 size={15} />
            Reset demo data
          </Button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="dialog-overlay" />
          <AlertDialog.Content className="dialog-content">
            <AlertDialog.Title>
              Delete all local demo records?
            </AlertDialog.Title>
            <AlertDialog.Description>
              This removes {records.length} check-ins from this browser,
              including your entries. This cannot be undone. Seed data will not
              return on refresh.
            </AlertDialog.Description>
            {error && (
              <p role="alert" className="field-error">
                {error}
              </p>
            )}
            <div className="dialog-actions">
              <AlertDialog.Cancel asChild>
                <Button variant="outline" disabled={busy}>
                  Keep records
                </Button>
              </AlertDialog.Cancel>
              <Button onClick={() => void confirm()} disabled={busy}>
                {busy ? "Deleting…" : "Delete all demo records"}
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
