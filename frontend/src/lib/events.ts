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


export const EVENTS: TixEvent[] = [
 
  {
    slug: "summer-beats-festival",
    title: "Summer Beats Festival",
    subtitle: "A full night of live headline sets",
    category: "Concerts",
    venue: "Madison Square Garden",
    city: "New York, NY",
    date: "Aug 24, 2026",
    time: "8:00 PM",
    image: eventConcert,
    badge: "FEATURED",
    featured: true,
    rating: 4.5,
    reviews: 1128,
    seating: "arena",
    about:
      "The loudest arena night of the summer, with a headline set plus two support acts and an after-show DJ session.",
    tiers: [
      {
        id: "floor",
        name: "Floor Reserved",
        price: 149,
        note: "Front-of-stage blocks, rows A-D",
        remaining: 18,
        seatZone: { rows: 4, seatsPerRow: 14 },
      },
      {
        id: "lower",
        name: "Lower Bowl",
        price: 89,
        note: "Sections 101-118, rows E-H",
        remaining: 74,
        seatZone: { rows: 4, seatsPerRow: 18, rowOffset: 4 },
      },
      {
        id: "upper",
        name: "Upper Bowl",
        price: 49,
        note: "Sections 301-334, rows J-L",
        remaining: 260,
        seatZone: { rows: 3, seatsPerRow: 22, rowOffset: 8 },
      },
    ],
  },
  {
    slug: "midnight-eclipse",
    title: "Midnight Eclipse",
    subtitle: "World tour with Twin Suns",
    category: "Concerts",
    venue: "The Forum",
    city: "Los Angeles, CA",
    date: "Sep 12, 2026",
    time: "9:45 PM",
    image: eventConcert,
    badge: "NEW",
    rating: 4.7,
    reviews: 612,
    seating: "arena",
    about:
      "A one-night-only co-headline show with a full production light rig and a limited-run merch drop at the door.",
    tiers: [
      {
        id: "pit",
        name: "Golden Pit",
        price: 199,
        note: "Barrier-adjacent, rows A-B",
        remaining: 9,
        seatZone: { rows: 2, seatsPerRow: 12 },
      },
      {
        id: "premium",
        name: "Premium Lower",
        price: 59,
        note: "Lower bowl, rows C-F",
        remaining: 46,
        seatZone: { rows: 4, seatsPerRow: 18, rowOffset: 2 },
      },
      {
        id: "ga",
        name: "Upper Level",
        price: 14.9,
        note: "Upper bowl, rows G-J",
        remaining: 900,
        seatZone: { rows: 3, seatsPerRow: 22, rowOffset: 6 },
      },
    ],
  },

  {
    slug: "interstellar-rerelease",
    title: "Interstellar — IMAX Re-Release",
    subtitle: "70mm IMAX presentation, 169 minutes",
    category: "Movies",
    venue: "Cinema 4 — Grand IMAX",
    city: "New York, NY",
    date: "Oct 3, 2026",
    time: "6:30 PM",
    image: eventMovies,
    badge: "HOT",
    rating: 4.9,
    reviews: 3120,
    seating: "cinema",
    about:
      "Reserved cinema seating with recliners in the premium rows. Pick your exact seats from the screen layout below.",
    tiers: [
      {
        id: "front",
        name: "Front Rows",
        price: 12.5,
        note: "Rows A-C, closest to screen",
        remaining: 34,
        seatZone: { rows: 3, seatsPerRow: 12 },
      },
      {
        id: "standard",
        name: "Standard Center",
        price: 16.5,
        note: "Rows D-G, center block",
        remaining: 58,
        seatZone: { rows: 4, seatsPerRow: 14, rowOffset: 3 },
      },
      {
        id: "recliner",
        name: "Premium Recliner",
        price: 24,
        note: "Rows H-J, reclining seats",
        remaining: 21,
        seatZone: { rows: 3, seatsPerRow: 10, rowOffset: 7 },
      },
    ],
  },
  
];

export const SERVICE_FEE_RATE = 0.08;

export function getEvent(slug: string) {
  return EVENTS.find((event) => event.slug === slug);
}

export function formatPrice(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
