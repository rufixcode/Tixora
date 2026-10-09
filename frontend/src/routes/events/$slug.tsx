import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { apiRequest } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FavoriteButton } from "@/components/favorite-button";
import { Checkout } from "@/features/events/checkout";
import { getEvent } from "@/lib/events";
export const Route = createFileRoute("/events/$slug")({
  // The web session is checked through the same-origin browser API.
  ssr: false,
  beforeLoad: async ({ params }) => {
    try {
      await apiRequest("/me");
    } catch (error) {
      if ((error as { status?: number }).status === 401) {
        throw redirect({ to: "/login", search: { next: `/events/${params.slug}` }, replace: true });
      }
      throw error;
    }
  },
  loader: async ({ params }) => {
    const event = await getEvent(params.slug);
    if (!event) throw notFound();
    return { event };
  },
  component: EventDetail,
});
function EventDetail() {
  const { event } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link to="/events" search={{ q: undefined, category: undefined }} className="text-primary">
          Back to all events
        </Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <section>
            <img
              src={event.image}
              alt={event.title}
              className="aspect-video w-full rounded-2xl object-cover"
            />
            <p className="mt-5 text-sm font-semibold text-primary">{event.category}</p>
            <h1 className="mt-2 text-4xl font-bold">{event.title}</h1>
            <p className="mt-3 text-muted-foreground">
              {event.venue} · {event.city}
            </p>
            <p className="mt-2 text-muted-foreground">
              {event.date} · {event.time}
            </p>
            <p className="my-6 leading-relaxed">{event.about}</p>
            <FavoriteButton slug={event.slug} />
          </section>
          <Checkout event={event} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
