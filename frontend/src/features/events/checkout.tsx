import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import { formatPrice, type TixEvent } from "@/lib/events";
import { Button } from "@/components/ui/button";
type Screening = {
  id: number;
  cinema_name: string;
  screen_name: string;
  start_time: string;
  ticket_price: number;
  available: boolean;
  available_seat_count: number;
};
type Seat = { id: number; row_label: string; seat_number: number; status: string };
type Hold = { hold_token: string; expires_at: string; total_amount: number };
export function Checkout({ event }: { event: TixEvent }) {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [screening, setScreening] = useState("");
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [hold, setHold] = useState<Hold | null>(null);
  const [tier, setTier] = useState(event.tiers[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(event.category === "Movies");
  const key = useRef<string | null>(null);
  const movie = event.category === "Movies";
  useEffect(() => {
    if (!movie) return;
    let active = true;
    apiRequest<{ screenings: Screening[] }>(`/movies/${encodeURIComponent(event.slug)}/screenings`)
      .then((r) => {
        if (active) setScreenings(r.screenings);
      })
      .catch(() => {
        if (active) setError("Could not load screenings. Refresh to retry.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [movie, event.slug]);
  useEffect(() => {
    if (!screening) return;
    let active = true;
    setLoading(true);
    setError("");
    apiRequest<{ seats: Seat[] }>(`/screenings/${screening}/seats`)
      .then((r) => {
        if (active) {
          setSeats(r.seats);
          setSelected([]);
        }
      })
      .catch(() => {
        if (active) setError("Could not load seats. Choose the screening again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [screening]);
  async function reserve() {
    setBusy(true);
    setError("");
    try {
      setHold(
        await apiRequest<Hold>(`/screenings/${screening}/holds`, {
          method: "POST",
          body: JSON.stringify({ seat_ids: selected }),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function release() {
    if (!hold) return;
    setBusy(true);
    try {
      await apiRequest(`/screenings/${screening}/holds/${hold.hold_token}`, { method: "DELETE" });
      setHold(null);
      setScreening("");
      key.current = null;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function pay() {
    setBusy(true);
    setError("");
    key.current ??= crypto.randomUUID();
    try {
      const path = movie
        ? `/screenings/${screening}/bookings`
        : `/events/${encodeURIComponent(event.slug)}/bookings`;
      const result = await apiRequest<{ checkout_url: string }>(path, {
        method: "POST",
        body: JSON.stringify(
          movie
            ? { hold_token: hold?.hold_token, request_key: key.current }
            : { ticket_type_id: tier, quantity, request_key: key.current },
        ),
      });
      const url = new URL(result.checkout_url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.paymongo.com")
        throw new Error("Invalid payment URL.");
      window.location.assign(url.href);
    } catch (e) {
      setError(
        (e as { status?: number }).status === 401
          ? "Please sign in before booking."
          : `${(e as Error).message} Resume any pending order from My bookings.`,
      );
    } finally {
      setBusy(false);
    }
  }
  const price = movie
    ? (screenings.find((s) => String(s.id) === screening)?.ticket_price ?? 0)
    : (event.tiers.find((t) => t.id === tier)?.price ?? 0);
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-card">
      <h2 className="text-xl font-bold">
        {movie ? "Choose a screening and seats" : "Choose your tickets"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        PayMongo sandbox · Test payments only. Tickets are issued after payment verification.
      </p>
      {loading && (
        <p className="mt-4" role="status">
          Loading availability...
        </p>
      )}
      {movie ? (
        <>
          <label className="mt-5 block text-sm font-medium">
            Screening
            <select
              className="mt-2 w-full rounded-lg border bg-background p-3"
              value={screening}
              disabled={busy || !!hold}
              onChange={(e) => {
                setScreening(e.target.value);
                key.current = null;
              }}
            >
              <option value="">Choose date and cinema</option>
              {screenings.map((s) => (
                <option key={s.id} value={s.id} disabled={!s.available || !s.available_seat_count}>
                  {s.cinema_name} · {new Date(s.start_time).toLocaleString()} ·{" "}
                  {s.available_seat_count} seats
                </option>
              ))}
            </select>
          </label>
          {!loading && screening && !hold && (
            <>
              <div className="my-4 rounded bg-muted p-2 text-center text-xs">SCREEN</div>
              <div className="flex max-h-80 flex-wrap gap-2 overflow-auto">
                {seats.map((s) => (
                  <button
                    key={s.id}
                    aria-pressed={selected.includes(s.id)}
                    disabled={
                      busy ||
                      s.status !== "available" ||
                      (!selected.includes(s.id) && selected.length >= 8)
                    }
                    onClick={() =>
                      setSelected((ids) =>
                        ids.includes(s.id) ? ids.filter((id) => id !== s.id) : [...ids, s.id],
                      )
                    }
                    className={`h-10 w-12 rounded border text-xs disabled:opacity-30 ${selected.includes(s.id) ? "bg-primary text-white" : "bg-background"}`}
                  >
                    {s.row_label}
                    {s.seat_number}
                  </button>
                ))}
              </div>
              <Button className="mt-4" disabled={busy || !selected.length} onClick={reserve}>
                Hold {selected.length} seats
              </Button>
            </>
          )}
          {hold && (
            <div className="mt-4 rounded-lg bg-muted p-4">
              <p>Seats held until {new Date(hold.expires_at).toLocaleTimeString()}.</p>
              <p className="font-bold">{formatPrice(hold.total_amount)}</p>
              <Button variant="ghost" disabled={busy} onClick={release}>
                Release seats
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-5 flex flex-wrap gap-3">
          <label>
            Ticket class
            <select
              value={tier}
              onChange={(e) => {
                setTier(e.target.value);
                key.current = null;
              }}
              className="block rounded-lg border bg-background p-3"
            >
              {event.tiers.map((t) => (
                <option key={t.id} value={t.id} disabled={t.remaining < 1}>
                  {t.name} · {formatPrice(t.price)} · {t.remaining} left
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity
            <input
              aria-label="Quantity"
              type="number"
              min={1}
              max={8}
              value={quantity}
              onChange={(e) => {
                setQuantity(Number(e.target.value));
                key.current = null;
              }}
              className="block w-24 rounded-lg border p-3"
            />
          </label>
        </div>
      )}
      <p className="mt-5 text-lg font-bold">
        Total: {formatPrice(hold?.total_amount ?? price * (movie ? selected.length : quantity))}
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        className="mt-5 w-full"
        disabled={
          busy ||
          loading ||
          (movie ? !hold : !event.booking_available || !tier || quantity < 1 || quantity > 8)
        }
        onClick={pay}
      >
        {busy ? "Please wait..." : "Continue to sandbox payment"}
      </Button>
      <a className="mt-3 block text-center text-sm text-primary" href="/bookings">
        My bookings and payment status
      </a>
    </section>
  );
}
