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
  const [maxSeats, setMaxSeats] = useState(8);
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
    apiRequest<{ seats: Seat[]; max_seats_per_order: number }>(`/screenings/${screening}/seats`)
      .then((r) => {
        if (active) {
          setSeats(r.seats);
          setMaxSeats(r.max_seats_per_order ?? 8);
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
  const activeScreening = screenings.find((s) => String(s.id) === screening);
  const selectedSeats = seats.filter((seat) => selected.includes(seat.id));
  const rows = new Map<string, Seat[]>();
  seats.forEach((seat) => rows.set(seat.row_label, [...(rows.get(seat.row_label) ?? []), seat]));
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-card">
      <h2 className="text-xl font-bold">
        {movie ? "Choose a screening and seats" : "Choose your tickets"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Test mode · No real charges. Tickets are issued after payment verification.
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
                setSeats([]);
                setSelected([]);
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
              <div className="mt-7">
                <h3 className="text-2xl font-extrabold">Choose your seats</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeScreening?.cinema_name} · {activeScreening?.screen_name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeScreening &&
                    new Intl.DateTimeFormat("en-PH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(activeScreening.start_time))}
                </p>
              </div>
              <div className="mt-7 rounded-b-[20px] bg-[#8F1527] py-2 text-center text-[11px] font-extrabold tracking-[2px] text-white">
                SCREEN
              </div>
              <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {[
                  ["Available", "bg-[#087443]"],
                  ["Selected", "bg-[#C61F37]"],
                  ["Unavailable", "bg-muted"],
                ].map(([label, color]) => (
                  <span key={label} className="flex items-center gap-1">
                    <span className={`size-3.5 rounded ${color}`} />
                    {label}
                  </span>
                ))}
              </div>
              <div
                className="mt-5 overflow-x-auto pb-2"
                role="group"
                aria-label="Choose your seats"
              >
                <div className="mx-auto flex w-max min-w-0 flex-col gap-2">
                  {[...rows.entries()].map(([row, rowSeats]) => (
                    <div key={row} className="flex items-center gap-2">
                      <span className="w-4 shrink-0 text-right text-xs font-extrabold text-muted-foreground">
                        {row}
                      </span>
                      <div className="flex gap-[5px]">
                        {rowSeats.map((s) => (
                          <button
                            type="button"
                            key={s.id}
                            aria-label={`${s.row_label}${s.seat_number}, ${s.status !== "available" ? s.status : selected.includes(s.id) ? "selected" : "available"}`}
                            aria-pressed={selected.includes(s.id)}
                            disabled={
                              busy ||
                              s.status !== "available" ||
                              (!selected.includes(s.id) && selected.length >= maxSeats)
                            }
                            onClick={() =>
                              setSelected((ids) =>
                                ids.includes(s.id)
                                  ? ids.filter((id) => id !== s.id)
                                  : [...ids, s.id],
                              )
                            }
                            className={`flex size-[27px] shrink-0 items-center justify-center rounded-[5px] text-[10px] font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed ${s.status !== "available" ? "bg-muted text-muted-foreground" : selected.includes(s.id) ? "bg-[#C61F37] text-white" : "bg-[#BCE6D2] text-[#17131A] enabled:hover:bg-[#9DD6BA]"}`}
                          >
                            {s.seat_number}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="mt-7 rounded-[14px] bg-secondary p-3"
                role="status"
                aria-live="polite"
              >
                <p className="text-sm font-extrabold">
                  {selected.length
                    ? `${selected.length} seat${selected.length === 1 ? "" : "s"} selected`
                    : "No seats selected"}
                </p>
                <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
                  {selected.length
                    ? selectedSeats.map((seat) => `${seat.row_label}${seat.seat_number}`).join(", ")
                    : `Select up to ${maxSeats} available seats.`}
                </p>
                <p className="mt-3 text-[22px] font-extrabold text-primary">
                  {formatPrice(price * selected.length)}
                </p>
              </div>
              <Button
                className="mt-5 min-h-[52px] w-full rounded-[14px] text-base font-extrabold"
                disabled={busy || !selected.length}
                onClick={reserve}
              >
                {busy ? "Checking seats…" : "Review selected seats"}
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
      {(!movie || hold) && (
        <p className="mt-5 text-lg font-bold">
          Total: {formatPrice(hold?.total_amount ?? price * (movie ? selected.length : quantity))}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {(!movie || hold) && (
        <Button
          className="mt-5 w-full"
          disabled={
            busy ||
            loading ||
            (movie ? !hold : !event.booking_available || !tier || quantity < 1 || quantity > 8)
          }
          onClick={pay}
        >
          {busy ? "Please wait..." : "Continue to payment"}
        </Button>
      )}
      <a className="mt-3 block text-center text-sm text-primary" href="/bookings">
        My bookings and payment status
      </a>
    </section>
  );
}
