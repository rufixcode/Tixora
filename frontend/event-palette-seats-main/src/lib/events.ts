import heroFestival from "@/assets/hero-festival.jpg";
import eventConcert from "@/assets/event-concert.jpg";
import eventMovies from "@/assets/event-movies.jpg";
import eventTheater from "@/assets/event-theater.jpg";

export type TicketTier = {
  id: string;
  name: string;
  price: number;
  note: string;
  remaining: number;
  seatZone?: { rows: number; seatsPerRow: number; rowOffset?: number };
};

export type EventCategory = "Concerts" | "Movies" | "Festivals" | "Theater";

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

export const CATEGORIES: EventCategory[] = ["Concerts", "Movies", "Festivals", "Theater"];

export const EVENTS: TixEvent[] = [
  {
    slug: "coachella-2026",
    title: "Coachella 2026",
    subtitle: "Featuring Drake, Billie Eilish, The Weeknd +40 more",
    category: "Festivals",
    venue: "Empire Polo Club",
    city: "Indio, California",
    date: "Apr 10, 2026",
    time: "12:00 PM",
    image: heroFestival,
    badge: "FEATURED",
    rating: 4.9,
    reviews: 4820,
    featured: true,
    about:
      "Three days, six stages and a desert skyline. Tixora is the official ticketing partner for general admission, VIP and shuttle passes.",
    tiers: [
      { id: "ga", name: "General Admission — 3 Day", price: 129, note: "Standing, all stages", remaining: 420 },
      { id: "ga-plus", name: "GA+ with Shuttle", price: 179, note: "Includes round-trip shuttle", remaining: 138 },
      { id: "vip", name: "VIP Field Pass", price: 349, note: "VIP viewing decks + lounges", remaining: 24 },
    ],
  },
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
    badge: "HOT",
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
  {
    slug: "hamilton",
    title: "Hamilton",
    subtitle: "A Musical by Lin-Manuel Miranda",
    category: "Theater",
    venue: "Richard Rodgers Theatre",
    city: "New York, NY",
    date: "Nov 2, 2026",
    time: "7:00 PM",
    image: eventTheater,
    rating: 4.9,
    reviews: 8430,
    about:
      "The Tony-winning story of America then, told by America now. Evening performance with a 2 hour 45 minute runtime.",
    tiers: [
      { id: "balcony", name: "Rear Balcony", price: 149, note: "Rows H-L", remaining: 88 },
      { id: "mezz", name: "Front Mezzanine", price: 249, note: "Rows A-D", remaining: 31 },
      { id: "orch", name: "Orchestra Center", price: 399, note: "Prime center seating", remaining: 12 },
    ],
  },
  {
    slug: "electric-garden-fest",
    title: "Electric Garden Fest",
    subtitle: "Two stages, sunset to sunrise",
    category: "Festivals",
    venue: "Riverfront Park",
    city: "Austin, TX",
    date: "Jul 18, 2026",
    time: "4:00 PM",
    image: heroFestival,
    badge: "HOT",
    rating: 4.6,
    reviews: 940,
    about:
      "An open-air electronic showcase with local food vendors, art installations and late-night sets until 4 AM.",
    tiers: [
      { id: "day", name: "Day Pass", price: 59, note: "Single day entry", remaining: 510 },
      { id: "weekend", name: "Weekend Pass", price: 99, note: "Both days", remaining: 210 },
      { id: "cabana", name: "Cabana Table (4 guests)", price: 640, note: "Reserved cabana + bottle", remaining: 6 },
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
