import eventConcert from "@/assets/event-concert.jpg";
import eventMovies from "@/assets/event-movies.jpg";

export type TicketTier = {
  id: string;
  name: string;
  price: number;
  note: string;
  remaining: number;
  seatZone?: { rows: number; seatsPerRow: number; rowOffset?: number };
};

export type EventCategory = "Concerts" | "Movies" | "Events";

export type TixEvent = {
  slug: string;
  title: string;
  subtitle: string;
  category: EventCategory;
  venue: string;
  city: string;
  date: string;
  time: string;
  image: string;
  badge?: "HOT" | "NEW" | "FEW LEFT" | "FEATURED";
  rating?: number;
  reviews?: number;
  featured?: boolean;
  seating?: "arena" | "cinema";
  about: string;
  tiers: TicketTier[];
};

export const CATEGORIES = ["Concerts", "Movies", "Events"] as const;

export const SERVICE_FEE_RATE = 0.08;

export const EVENTS: TixEvent[] = [];

export async function fetchEvents(params?: { q?: string; category?: string; featured?: boolean; limit?: number }) {
  const query = new URLSearchParams();

  if (params?.q) query.set("q", params.q);
  if (params?.category) query.set("category", params.category);
  if (params?.featured) query.set("featured", "true");
  if (params?.limit) query.set("limit", String(params.limit));

  const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"}/events${query.toString() ? `?${query.toString()}` : ""}`);

  if (!response.ok) {
    throw new Error("Failed to load events");
  }

  const data = (await response.json()) as TixEvent[];

  return data.map((event) => ({
    ...event,
    image: event.image || (event.category === "Movies" ? eventMovies : eventConcert),
  }));
}

export async function getEvent(slug: string) {
  const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"}/events/${slug}`);

  if (!response.ok) {
    return undefined;
  }

  const event = (await response.json()) as TixEvent;

  return {
    ...event,
    image: event.image || (event.category === "Movies" ? eventMovies : eventConcert),
  };
}

export function formatPrice(value: number) {
  return value.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
  });
}
