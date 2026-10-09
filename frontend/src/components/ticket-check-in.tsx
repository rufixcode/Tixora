import { useState } from "react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";

type CheckedTicket = {
  ticket_number: string;
  event_title: string;
  status: string;
  admitted: boolean;
};
export function TicketCheckIn() {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<CheckedTicket | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function check(admit: boolean) {
    setBusy(true);
    setError("");
    try {
      const ticket = await apiRequest<CheckedTicket>("/admin/tickets/check", {
        method: "POST",
        body: JSON.stringify({ code: code.trim(), admit, ...(admit ? { password } : {}) }),
      });
      setResult(ticket);
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    } finally {
      setBusy(false);
      setPassword("");
    }
  }
  return (
    <section className="max-w-xl space-y-4 rounded-3xl border bg-card p-6">
      <h2 className="font-display text-2xl font-bold">Ticket check-in</h2>
      <p className="text-sm text-muted-foreground">
        Scan the ticket with a QR reader and paste its entry code here. Check the event before
        admitting the guest.
      </p>
      <label className="block text-sm font-semibold">
        Entry code
        <textarea
          value={code}
          disabled={busy}
          onChange={(e) => {
            setCode(e.target.value);
            setResult(null);
          }}
          placeholder="tixora:ticket:…"
          rows={3}
          className="mt-2 w-full rounded-xl border bg-background p-3 font-mono text-sm"
        />
      </label>
      <Button disabled={busy || !code.trim()} onClick={() => void check(false)}>
        Check ticket
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {result && (
        <div role="status" className="space-y-3 rounded-2xl bg-primary-soft p-4">
          <h3 className="font-bold">{result.event_title}</h3>
          <p className="break-all text-xs">{result.ticket_number}</p>
          <p className="font-semibold">
            {result.admitted
              ? "Guest admitted. Ticket marked as used."
              : result.status === "valid"
                ? "Valid ticket — ready for entry"
                : "Ticket unavailable or already used"}
          </p>
          {result.status === "valid" && (
            <>
              <label className="block text-sm">
                Your admin password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full rounded-xl border bg-background p-3"
                />
              </label>
              <Button
                disabled={busy || !password}
                onClick={() => {
                  if (
                    window.confirm(
                      `Admit one guest to ${result.event_title}? This ticket can only be used once.`,
                    )
                  )
                    void check(true);
                }}
              >
                Admit guest
              </Button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
