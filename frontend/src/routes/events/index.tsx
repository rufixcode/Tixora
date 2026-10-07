import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { EventCard } from "@/features/events/event-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";
import { CATEGORIES, fetchEvents, type EventCategory, type TixEvent } from "@/lib/events";

type EventSearch = { q: string | undefined; category: EventCategory | undefined };

export const Route = createFileRoute("/events/")({
  validateSearch: (search: Record<string, unknown>): EventSearch => ({
    q: typeof search["q"] === "string" && search["q"] ? (search["q"] as string) : undefined,
    category: CATEGORIES.includes(search["category"] as EventCategory)
      ? (search["category"] as EventCategory)
      : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Browse Live Events & Tickets | Tixora" },
      {
        name: "description",
        content:
          "Browse every Tixora event — concerts, movies, festivals and theater. Filter by category, compare tiers and book instantly.",
      },
      { property: "og:title", content: "Browse Live Events & Tickets | Tixora" },
      {
        property: "og:description",
        content:
          "Filter concerts, movies, festivals and theater events and book tickets in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { q, category } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [results, setResults] = useState<TixEvent[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchEvents({ q, category });

        if (active) {
          setResults(data);
        }
      } catch {
        if (active) {
          setError("Could not load events. Refresh to try again.");
          setResults([]);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [q, category]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {error && (
        <p role="alert" className="mx-auto mt-6 max-w-6xl text-destructive">
          {error}
        </p>
      )}

      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="eyebrow text-primary">Event catalog</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Find your next night out</h1>

        <div className="relative mt-6 max-w-xl">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q ?? ""}
            onChange={(e) =>
              navigate({ search: (prev) => ({ ...prev, q: e.target.value || undefined }) })
            }
            placeholder="Search events, venues, artists..."
            className="h-11 pl-9"
            aria-label="Search events"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => navigate({ search: (prev) => ({ ...prev, category: undefined }) })}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              !category
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((item) => (
            <button
              key={item}
              onClick={() => navigate({ search: (prev) => ({ ...prev, category: item }) })}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                category === item
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          {isLoading
            ? "Loading events..."
            : `${results.length} ${results.length === 1 ? "event" : "events"} available`}
        </p>

        {!isLoading ? (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((event) => (
              <EventCard key={event.slug} event={event} />
            ))}
          </div>
        ) : null}

        {!isLoading && results.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="font-semibold">No events matched that search.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different artist, venue or city.
            </p>
          </div>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
