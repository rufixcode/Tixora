import { ApiError, apiRequest } from "@/lib/api";

export type EventCategory = "Concerts" | "Movies" | "Events";
export type TicketTier = {
  id: string;
  name: string;
  price: number;
  note: string;
  remaining: number;
};
export type TixEvent = {
  status?: string;
  admin_subtitle?: string;
  resource_type: "movie" | "concert" | "event";
  resource_id: number;
  starts_at?: string | null;
  booking_available?: boolean;
  slug: string;
  title: string;
  subtitle: string;
  category: EventCategory;
  venue: string;
  city: string;
  date: string;
  time: string;
  image: string | null;
  badge?: "HOT" | "NEW" | "FEW LEFT" | "FEATURED";
  featured?: boolean;
  seating?: "arena" | "cinema" | null;
  about: string;
  tiers: TicketTier[];
};
export const categories: EventCategory[] = ["Concerts", "Movies", "Events"];

export async function fetchEvents(
  params: {
    q?: string;
    category?: EventCategory;
    featured?: boolean;
    limit?: number;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  if (params.featured) query.set("featured", "true");
  if (params.limit) query.set("limit", String(params.limit));
  return apiRequest<TixEvent[]>(`/events${query.size ? `?${query}` : ""}`);
}

// The Laravel API uses one detail endpoint for movies, concerts, and events.
export async function getEvent(slug: string) {
  try {
    return await apiRequest<TixEvent>(`/events/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export function formatPrice(value: number) {
  return value.toLocaleString("en-PH", { currency: "PHP", style: "currency" });
}
