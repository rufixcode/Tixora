import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { EventCard } from "@/features/events/event-card";
import { FavoriteButton } from "@/components/favorite-button";
import { apiRequest } from "@/lib/api";
import type { TixEvent } from "@/lib/events";
export const Route = createFileRoute("/favorites")({ component: Favorites });
function Favorites() {
  const [items, setItems] = useState<TixEvent[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiRequest<TixEvent[]>("/favorites")
      .then(setItems)
      .catch(() => setError("Sign in or refresh to load your saved events."))
      .finally(() => setLoading(false));
  }, []);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">Saved events</h1>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : !items.length ? (
          <p>No saved events yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((e) => (
              <div key={e.slug}>
                <EventCard event={e} />
                <div className="mt-2">
                  <FavoriteButton
                    slug={e.slug}
                    initialSaved
                    onChange={(saved) => {
                      if (!saved) setItems((items) => items.filter((item) => item.slug !== e.slug));
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
