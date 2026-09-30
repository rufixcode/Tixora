import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPrice, type TixEvent } from "@/lib/events";

const BADGE_STYLES: Record<string, string> = {
  HOT: "bg-coral text-primary-foreground",
  NEW: "bg-teal text-ink",
  "FEW LEFT": "bg-warning text-ink",
  FEATURED: "bg-gradient-primary text-primary-foreground",
};

export function EventCard({ event }: { event: TixEvent }) {
  const from = Math.min(...event.tiers.map((tier) => tier.price));
  const isMovie = event.category === "Movies";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-glow">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          width={1024}
          height={640}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {event.badge ? (
          <span
            className={`absolute left-3 top-3 rounded-md px-2 py-1 text-[10px] font-bold tracking-widest ${
              BADGE_STYLES[event.badge]
            }`}
          >
            {event.badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="eyebrow text-primary">{event.category}</p>
          <h3 className="mt-1 text-lg font-bold leading-tight">{event.title}</h3>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          {!isMovie ? (
            <>
              <p className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0" />
                {event.venue}, {event.city}
              </p>
              <p className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5 shrink-0" />
                {event.date} · {event.time}
              </p>
            </>
          ) : null}
          {event.rating ? (
            <p className="flex items-center gap-1.5">
              <Star className="size-3.5 shrink-0 fill-warning text-warning" />
              <span className="font-semibold text-foreground">{event.rating}</span>
              <span>({event.reviews?.toLocaleString()} reviews)</span>
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-3">
          <div>
            <p className="eyebrow text-muted-foreground">Price</p>
            <p className="text-base font-bold">
              {Number.isFinite(from) ? `From ${formatPrice(from)}` : "Pricing coming soon"}
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="/events/$slug" params={{ slug: event.slug }}>
              View event
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
