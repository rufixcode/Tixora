import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Minus,
  Plus,
  Star,
  Ticket,
} from "lucide-react";

import { SeatMap, type SeatSelection } from "@/components/seat-map";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice, getEvent, SERVICE_FEE_RATE } from "@/lib/events";

export const Route = createFileRoute("/events/$slug")({
  loader: ({ params }) => {
    const event = getEvent(params.slug);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    const event = loaderData?.event;
    const title = event ? `${event.title} Tickets — ${event.city} | Tixora` : "Event Tickets | Tixora";
    const description = event
      ? `Book ${event.title} tickets at ${event.venue}, ${event.city} on ${event.date}. Pick your tier and check out in seconds.`
      : "Book tickets for live events on Tixora.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: EventDetail,
});

const DELIVERY = ["Mobile Entry", "Will Call / Box Office", "Print-at-Home"];

function EventDetail() {
  const { event } = Route.useLoaderData();

  const hasSeating = Boolean(event.seating);
  const [tierId, setTierId] = useState(event.tiers[0]!.id);
  const [quantity, setQuantity] = useState(2);
  const [seats, setSeats] = useState<SeatSelection[]>([]);
  const [delivery, setDelivery] = useState(DELIVERY[0]!);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [seatError, setSeatError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [booked, setBooked] = useState<{ ref: string; total: number } | null>(null);

  const tier = event.tiers.find((item) => item.id === tierId) ?? event.tiers[0]!;
  const count = hasSeating ? seats.length : quantity;
  const orderLabel = hasSeating
    ? seats.map((seat) => seat.label).join(", ")
    : `${quantity}x ${tier.name}`;
  const subtotal = hasSeating
    ? seats.reduce((sum, seat) => sum + seat.price, 0)
    : tier.price * quantity;
  const fees = subtotal * SERVICE_FEE_RATE;
  const total = subtotal + fees;

  function toggleSeat(seat: SeatSelection) {
    setSeats((current) =>
      current.some((item) => item.id === seat.id)
        ? current.filter((item) => item.id !== seat.id)
        : [...current, seat],
    );
  }

  function review() {
    if (hasSeating && seats.length === 0) {
      setEmailError("");
      setSeatError("Please pick at least one seat from the map");
      return;
    }
    setSeatError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");
    setConfirmOpen(true);
  }

  function confirmBooking() {
    setConfirmOpen(false);
    setBooked({
      ref: `TX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      total,
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="relative isolate overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            width={1920}
            height={1088}
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-ink/75" />
          <div className="relative mx-auto max-w-6xl px-4 py-16">
            <Link
              to="/events"
              search={{ q: undefined, category: undefined }}
              className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
            >
              <ArrowLeft className="size-4" /> All events
            </Link>
            <p className="eyebrow mt-6 text-teal">{event.category}</p>
            <h1 className="mt-2 max-w-3xl text-4xl font-extrabold text-primary-foreground sm:text-5xl">
              {event.title}
            </h1>
            <p className="mt-2 max-w-xl text-primary-foreground/80">{event.subtitle}</p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-foreground/85">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" /> {event.venue}, {event.city}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" /> {event.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" /> {event.time}
              </span>
              {event.rating ? (
                <span className="flex items-center gap-1.5">
                  <Star className="size-4 fill-warning text-warning" /> {event.rating} (
                  {event.reviews?.toLocaleString()})
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1.4fr_1fr]">
          {/* Tiers */}
          <div>
            <h2 className="text-2xl font-bold">
              {hasSeating
                ? event.seating === "cinema"
                  ? "Choose your cinema seats"
                  : "Choose your arena seats"
                : "Select ticket class"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{event.about}</p>

            {hasSeating ? (
              <div className="mt-6">
                <SeatMap event={event} selected={seats} onToggle={toggleSeat} />
                {seatError ? (
                  <p className="mt-3 text-sm text-destructive">{seatError}</p>
                ) : null}
              </div>
            ) : (
            <div className="mt-6 space-y-3">
              {event.tiers.map((item) => {
                const selected = item.id === tier.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTierId(item.id)}
                    className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-all ${
                      selected
                        ? "border-primary bg-accent shadow-glow"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.note}</p>
                      <p className="mt-1 text-xs font-semibold text-coral">
                        {item.remaining} remaining
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatPrice(item.price)}</p>
                      <p className="eyebrow text-muted-foreground">per ticket</p>
                    </div>
                  </button>
                );
              })}
            </div>
            )}

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  aria-invalid={Boolean(emailError)}
                />
                {emailError ? <p className="text-sm text-destructive">{emailError}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery">Delivery method</Label>
                <Select value={delivery} onValueChange={setDelivery}>
                  <SelectTrigger id="delivery">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERY.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <p className="eyebrow text-primary">Ticket summary</p>
              <h3 className="mt-1 text-xl font-bold">{event.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {event.date} · {event.time}
              </p>

              {hasSeating ? (
                <div className="mt-5 rounded-xl bg-muted/60 p-3">
                  <p className="text-sm font-medium">
                    {seats.length ? `${seats.length} seat${seats.length > 1 ? "s" : ""} selected` : "No seats selected yet"}
                  </p>
                  {seats.length ? (
                    <p className="mt-1 text-xs text-muted-foreground">{orderLabel}</p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tap seats on the map to add them to your order.
                    </p>
                  )}
                </div>
              ) : (
              <div className="mt-5 flex items-center justify-between">
                <span className="text-sm font-medium">Quantity</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-6 text-center font-bold">{quantity}</span>
                  <Button
                    size="icon"
                    onClick={() => setQuantity((q) => Math.min(8, q + 1))}
                    aria-label="Increase quantity"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
              )}

              <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    {hasSeating ? `${count} seat${count === 1 ? "" : "s"}` : orderLabel}
                  </dt>
                  <dd className="font-semibold">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Service fee (8%)</dt>
                  <dd className="font-semibold">{formatPrice(fees)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-3 text-base">
                  <dt className="font-bold">Total due</dt>
                  <dd className="font-bold text-primary">{formatPrice(total)}</dd>
                </div>
              </dl>

              <Button className="mt-5 w-full gap-2" size="lg" onClick={review}>
                <Ticket className="size-4" />
                Confirm purchase
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {delivery} · free transfers up to 2 hours before showtime
              </p>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm booking</DialogTitle>
            <DialogDescription>
              You are placing a reservation for {orderLabel || `${count} tickets`} to {event.title}. Total{" "}
              {formatPrice(total)}, charged to {email}. Tickets are subject to our standard refund
              policy.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmBooking}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success dialog */}
      <Dialog open={Boolean(booked)} onOpenChange={(open) => !open && setBooked(null)}>
        <DialogContent>
          <DialogHeader>
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <CheckCircle2 className="size-6" />
            </span>
            <DialogTitle className="mt-3">Tickets booked successfully</DialogTitle>
            <DialogDescription>
              Booking reference <strong>{booked?.ref}</strong> — {orderLabel} for{" "}
              {event.title}. A {delivery.toLowerCase()} pass and receipt for{" "}
              {formatPrice(booked?.total ?? 0)} were sent to {email}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button asChild variant="outline">
              <Link to="/events" search={{ q: undefined, category: undefined }}>
                Browse more events
              </Link>
            </Button>
            <Button onClick={() => setBooked(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
