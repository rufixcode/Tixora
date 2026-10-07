import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Search, ShieldCheck, Smartphone, Zap } from "lucide-react";

import heroFestival from "@/assets/hero-festival.jpg";
import { EventCard } from "@/features/events/event-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES, fetchEvents, type TixEvent } from "@/lib/events";

const PERKS = [
  { icon: Zap, title: "Instant checkout", copy: "Choose tickets and try PayMongo test checkout." },
  { icon: Smartphone, title: "Mobile entry", copy: "View verified test tickets in My bookings." },
  { icon: ShieldCheck, title: "Fees up front", copy: "Review your order total before checkout." },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [featured, setFeatured] = useState<TixEvent | null>(null);
  const [trending, setTrending] = useState<TixEvent[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [featuredData, trendingData] = await Promise.all([
          fetchEvents({ featured: true, limit: 1 }),
          fetchEvents({ limit: 4 }),
        ]);

        if (!active) {
          return;
        }

        const featuredEvent = featuredData[0] ?? trendingData[0] ?? null;
        setFeatured(featuredEvent);
        setTrending(trendingData.filter((event) => event.slug !== featuredEvent?.slug).slice(0, 4));
      } catch {
        if (active) {
          setFeatured(null);
          setTrending([]);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/events", search: { q: query || undefined, category: undefined } });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <img
            src={heroFestival}
            alt="Festival crowd under purple stage lights"
            width={1920}
            height={1088}
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-ink/75" />
          <div className="relative mx-auto max-w-6xl px-4 py-24 sm:py-32">
            <p className="eyebrow text-teal">Tixora · Sandbox preview</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-[1.05] text-primary-foreground sm:text-6xl">
              Unlock live events near you
            </h1>
            <p className="mt-4 max-w-xl text-base text-primary-foreground/80 sm:text-lg">
              Concerts, movies, festivals and theater — real seats, real prices, booked in seconds.
            </p>

            <form
              onSubmit={submitSearch}
              className="mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-border/20 bg-background/95 p-2 shadow-glow sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search events, venues, artists..."
                  className="h-11 border-0 pl-9 shadow-none focus-visible:ring-0"
                  aria-label="Search events"
                />
              </div>
              <Button type="submit" size="lg" className="h-11">
                Find tickets
              </Button>
            </form>

            <div className="mt-5 flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <Link
                  key={category}
                  to="/events"
                  search={{ q: undefined, category }}
                  className="rounded-full border border-primary-foreground/25 px-4 py-1.5 text-sm font-medium text-primary-foreground/90 transition-colors hover:bg-primary-foreground/15"
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Trending */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow text-primary">Popular near you</p>
              <h2 className="mt-1 text-3xl font-bold">Trending this month</h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/events" search={{ q: undefined, category: undefined }}>
                View all events
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {trending.map((event) => (
              <EventCard key={event.slug} event={event} />
            ))}
          </div>
        </section>

        {/* Featured festival */}
        {featured ? (
          <section className="mx-auto max-w-6xl px-4 pb-16">
            <div className="relative isolate overflow-hidden rounded-3xl">
              <img
                src={featured.image}
                alt={featured.title}
                width={1920}
                height={1088}
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/60 to-ink/20" />
              <div className="relative flex flex-col gap-6 p-8 sm:p-12 md:flex-row md:items-end md:justify-between">
                <div>
                  <span className="eyebrow rounded-md bg-gradient-primary px-2 py-1 text-primary-foreground">
                    Featured
                  </span>
                  <h2 className="mt-4 text-4xl font-extrabold text-primary-foreground sm:text-5xl">
                    {featured.title}
                  </h2>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-primary-foreground/80">
                    <MapPin className="size-4" /> {featured.city}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-primary-foreground/80">
                    <CalendarDays className="size-4" /> {featured.date} · {featured.time}
                  </p>
                  <p className="mt-3 max-w-lg text-sm text-primary-foreground/70">
                    {featured.subtitle}
                  </p>
                </div>
                <Button asChild size="lg" className="shrink-0">
                  <Link to="/events/$slug" params={{ slug: featured.slug }}>
                    Get passes
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {/* Perks */}
        <section className="border-t border-border bg-secondary/40">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-3">
            {PERKS.map((perk) => (
              <div
                key={perk.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <perk.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{perk.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{perk.copy}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
