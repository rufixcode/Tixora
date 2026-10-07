import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/events";
export const Route = createFileRoute("/bookings")({ component: Bookings });
type Booking = {
  id: number;
  event_title: string;
  booking_reference: string;
  status: string;
  total_amount: number;
  tickets: { ticket_number: string; status: string }[];
  seats: { row_label: string; seat_number: number }[];
};
function Bookings() {
  const [items, setItems] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true);
    setError("");
    try {
      setItems(await apiRequest<Booking[]>("/bookings"));
    } catch (e) {
      setError(
        (e as { status?: number }).status === 401
          ? "Sign in to view your bookings. If you paid from mobile, return to the app and refresh My bookings."
          : (e as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function action(id: number, kind: "checkout" | "cancel") {
    if (
      kind === "cancel" &&
      !window.confirm("Cancel this pending booking and release its tickets?")
    )
      return;
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<{ checkout_url?: string }>(`/bookings/${id}/${kind}`, {
        method: "POST",
      });
      if (result.checkout_url) {
        const url = new URL(result.checkout_url);
        if (url.protocol !== "https:" || url.hostname !== "checkout.paymongo.com")
          throw new Error("Invalid payment URL");
        window.location.assign(url.href);
      } else await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My bookings</h1>
          <Button variant="outline" disabled={busy} onClick={load}>
            Refresh status
          </Button>
        </div>
        <p className="my-4 text-muted-foreground">
          Sandbox payments only. Returning from checkout does not confirm payment; verified payments
          appear here. Pending bookings keep inventory reserved until paid or cancelled.
        </p>
        {error && (
          <p role="alert" className="my-4 text-destructive">
            {error} <Link to="/login">Sign in</Link>
          </p>
        )}
        {!busy && !error && !items.length && (
          <p>No bookings yet. Browse an event to get started.</p>
        )}
        <div className="space-y-4">
          {items.map((b) => (
            <article key={b.id} className="rounded-2xl border bg-card p-5">
              <h2 className="text-xl font-bold">{b.event_title ?? b.booking_reference}</h2>
              <p className="text-sm text-muted-foreground">{b.booking_reference}</p>
              <p className="my-2 font-semibold">
                {b.status} · {formatPrice(b.total_amount)}
              </p>
              {b.seats.length > 0 && (
                <p>Seats: {b.seats.map((s) => `${s.row_label}${s.seat_number}`).join(", ")}</p>
              )}
              {b.tickets.map((t) => (
                <p key={t.ticket_number} className="mt-2 rounded bg-muted p-2 text-sm">
                  Ticket {t.ticket_number} · {t.status}
                </p>
              ))}
              {b.status === "pending" && (
                <div className="mt-4 flex gap-3">
                  <Button disabled={busy} onClick={() => action(b.id, "checkout")}>
                    Resume test payment
                  </Button>
                  <Button variant="outline" disabled={busy} onClick={() => action(b.id, "cancel")}>
                    Cancel booking
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
