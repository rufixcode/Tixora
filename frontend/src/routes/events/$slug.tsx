import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, CreditCard, MapPin, Minus, Plus, QrCode, Star } from "lucide-react";
import { SeatMap, type SeatSelection } from "@/features/events/seat-map";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice, getEvent, SERVICE_FEE_RATE } from "@/lib/events";

export const Route = createFileRoute("/events/$slug")({
  loader: ({ params }) => { const event = getEvent(params.slug); if (!event) throw notFound(); return { event }; },
  component: EventDetail,
});

function TicketQr({ reference }: { reference: string }) {
  return <div className="grid size-40 grid-cols-[repeat(11,minmax(0,1fr))] gap-px border-8 border-background bg-background p-1">{Array.from({ length: 121 }, (_, i) => {
    const row = Math.floor(i / 11), col = i % 11;
    const finder = (top: number, left: number) => row >= top && row < top + 3 && col >= left && col < left + 3;
    const dark = finder(0, 0) || finder(0, 8) || finder(8, 0) || (row * 17 + col * 11 + reference.length * 7) % 5 < 2;
    return <span key={i} className={dark ? "bg-foreground" : "bg-background"} />;
  })}</div>;
}

function EventDetail() {
  const { event } = Route.useLoaderData();
  const isMovie = event.category === "Movies";
  const hasSeating = event.category !== "Events" && Boolean(event.seating);
  const cinemas = event.showtimes ?? [];
  const [cinemaIndex, setCinemaIndex] = useState(0);
  const [showtime, setShowtime] = useState("");
  const [tierId, setTierId] = useState(event.tiers[0]!.id);
  const [quantity, setQuantity] = useState(1);
  const [seats, setSeats] = useState<SeatSelection[]>([]);
  const [error, setError] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [booked, setBooked] = useState<{ ref: string; total: number } | null>(null);
  const cinema = cinemas[cinemaIndex];
  const tier = event.tiers.find((item) => item.id === tierId) ?? event.tiers[0]!;
  const count = hasSeating ? seats.length : quantity;
  const orderLabel = hasSeating ? seats.map((seat) => seat.label).join(", ") : `${quantity}x ${tier.name}`;
  const subtotal = hasSeating ? seats.reduce((sum, seat) => sum + seat.price, 0) : tier.price * quantity;
  const total = subtotal + subtotal * SERVICE_FEE_RATE;
  const venue = isMovie && cinema ? `${cinema.cinema}, ${cinema.mall}` : `${event.venue}, ${event.city}`;
  const time = isMovie && showtime ? showtime : event.time;
  const changeCinema = (index: number) => { setCinemaIndex(index); setShowtime(""); setSeats([]); };
  const toggleSeat = (seat: SeatSelection) => setSeats((current) => current.some((item) => item.id === seat.id) ? current.filter((item) => item.id !== seat.id) : [...current, seat]);
  const proceed = () => {
    if (isMovie && !showtime) return setError("Choose a cinema and showtime before selecting seats.");
    if (hasSeating && !seats.length) return setError("Please pick at least one seat from the map.");
    setError(""); setPaymentOpen(true);
  };
  const pay = () => { setPaymentOpen(false); setBooked({ ref: `TX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, total }); };

  return <div className="min-h-screen bg-background"><SiteHeader /><main>
    <section className="relative isolate overflow-hidden"><img src={event.image} alt={event.title} width={1920} height={1088} className="absolute inset-0 size-full object-cover" /><div className="absolute inset-0 bg-ink/75" /><div className="relative mx-auto max-w-6xl px-4 py-16">
      <Link to="/events" search={{ q: undefined, category: undefined }} className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/80 hover:text-primary-foreground"><ArrowLeft className="size-4" /> All events</Link>
      <p className="eyebrow mt-6 text-teal">{event.category}</p><h1 className="mt-2 max-w-3xl text-4xl font-extrabold text-primary-foreground sm:text-5xl">{event.title}</h1><p className="mt-2 max-w-xl text-primary-foreground/80">{event.subtitle}</p>
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-foreground/85">{event.rating ? <span className="flex items-center gap-1.5"><Star className="size-4 fill-warning text-warning" /> {event.rating} ({event.reviews?.toLocaleString()})</span> : null}</div>
    </div></section>
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1.4fr_1fr]"><div>
      <h2 className="text-2xl font-bold">{isMovie ? "Choose cinema, showtime and seats" : hasSeating ? "Choose your concert seats" : "Reserve your tickets"}</h2><p className="mt-1 text-sm text-muted-foreground">{event.about}</p>
      {isMovie ? <div className="mt-6 space-y-5"><div><p className="text-sm font-bold">1. Select a cinema</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{cinemas.map((option, index) => <button key={`${option.cinema}-${option.mall}`} type="button" onClick={() => changeCinema(index)} className={`rounded-xl border p-4 text-left transition-colors ${cinemaIndex === index ? "border-primary bg-accent shadow-glow" : "border-border bg-card hover:border-primary/40"}`}><p className="font-bold">{option.cinema}</p><p className="mt-1 text-sm text-muted-foreground">{option.mall}</p></button>)}</div></div><div><p className="text-sm font-bold">2. Select a showtime</p><div className="mt-3 flex flex-wrap gap-2">{cinema?.times.map((option) => <Button key={option} type="button" variant={showtime === option ? "default" : "outline"} onClick={() => { setShowtime(option); setError(""); }}>{option}</Button>)}</div></div><div className={showtime ? "" : "pointer-events-none opacity-50"}><p className="text-sm font-bold">3. Choose your seats</p><div className="mt-3"><SeatMap event={event} selected={seats} onToggle={toggleSeat} /></div></div></div> : hasSeating ? <div className="mt-6"><SeatMap event={event} selected={seats} onToggle={toggleSeat} /></div> : <div className="mt-6 space-y-3">{event.tiers.map((item) => <button key={item.id} type="button" onClick={() => setTierId(item.id)} className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left ${item.id === tier.id ? "border-primary bg-accent shadow-glow" : "border-border bg-card hover:border-primary/40"}`}><div><p className="font-bold">{item.name}</p><p className="text-sm text-muted-foreground">{item.note}</p></div><p className="text-lg font-bold">{formatPrice(item.price)}</p></button>)}</div>}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div><aside className="lg:sticky lg:top-24 lg:self-start"><div className="rounded-2xl border border-border bg-card p-6 shadow-card"><p className="eyebrow text-primary">Ticket summary</p><h3 className="mt-1 text-xl font-bold">{event.title}</h3><p className="mt-1 text-sm text-muted-foreground">{event.date} · {time}</p>
      {hasSeating ? <div className="mt-5 rounded-xl bg-muted/60 p-3"><p className="text-sm font-medium">{seats.length ? `${seats.length} seat${seats.length > 1 ? "s" : ""} selected` : "No seats selected yet"}</p><p className="mt-1 text-xs text-muted-foreground">{seats.length ? orderLabel : "Select seats from the map to continue."}</p></div> : <div className="mt-5 flex items-center justify-between"><span className="text-sm font-medium">Quantity</span><div className="flex items-center gap-3"><Button variant="outline" size="icon" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><Minus className="size-4" /></Button><span className="w-6 text-center font-bold">{quantity}</span><Button size="icon" onClick={() => setQuantity((q) => Math.min(8, q + 1))} aria-label="Increase quantity"><Plus className="size-4" /></Button></div></div>}
      <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm"><div className="flex justify-between"><dt className="text-muted-foreground">{hasSeating ? `${count} seat${count === 1 ? "" : "s"}` : orderLabel}</dt><dd className="font-semibold">{formatPrice(subtotal)}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Service fee (8%)</dt><dd className="font-semibold">{formatPrice(subtotal * SERVICE_FEE_RATE)}</dd></div><div className="flex justify-between border-t border-border pt-3 text-base"><dt className="font-bold">Total due</dt><dd className="font-bold text-primary">{formatPrice(total)}</dd></div></dl><Button className="mt-5 w-full gap-2" size="lg" onClick={proceed}><CreditCard className="size-4" /> Proceed to payment</Button><p className="mt-3 text-center text-xs text-muted-foreground">Your QR ticket is shown immediately after payment.</p></div></aside></div>
  </main><SiteFooter />
  <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}><DialogContent><DialogHeader><DialogTitle>Payment</DialogTitle><DialogDescription>Pay {formatPrice(total)} for {orderLabel || "your selected tickets"}.</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="payment-method">Payment method</Label><Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger id="payment-method"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Card">Credit or debit card</SelectItem><SelectItem value="GCash">GCash</SelectItem><SelectItem value="Maya">Maya</SelectItem></SelectContent></Select></div><DialogFooter><Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button><Button onClick={pay}>Pay {formatPrice(total)}</Button></DialogFooter></DialogContent></Dialog>
  <Dialog open={Boolean(booked)} onOpenChange={(open) => !open && setBooked(null)}><DialogContent><DialogHeader><div className="inline-flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground"><CheckCircle2 className="size-6" /></div><DialogTitle className="mt-3">Payment successful</DialogTitle><DialogDescription>Your ticket is ready. Show this QR code at the entrance.</DialogDescription></DialogHeader><div className="flex flex-col items-center rounded-xl bg-muted/50 p-5"><TicketQr reference={booked?.ref ?? ""} /><div className="mt-4 flex items-center gap-2 text-sm font-semibold"><QrCode className="size-4 text-primary" /> Booking {booked?.ref}</div><p className="mt-1 text-xs text-muted-foreground">{orderLabel} · {formatPrice(booked?.total ?? 0)}</p></div><DialogFooter><Button asChild variant="outline"><Link to="/events" search={{ q: undefined, category: undefined }}>Browse more</Link></Button><Button onClick={() => setBooked(null)}>Done</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
