import lanyImage from "@/assets/Lany.jpg";
import avengersImage from "@/assets/Avengers.jpg";
import spidermanImage from "@/assets/Spiderman.jpg";
import taylorSwiftImage from "@/assets/TaylorSwift.jpg";
import tedtalkImage from "@/assets/TED.jpg";
import expoImage from "@/assets/Expo.jpg";


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
    slug: "lany-a-beautiful-blur",
    title: "LANY — A Beautiful Blur: The World Tour",
    subtitle: "An unforgettable night of live music",
    category: "Concerts",
    venue: "SM Mall of Asia Arena",
    city: "Pasay City, Philippines",
    date: "Oct 18, 2026",
    time: "8:00 PM",
    image: lanyImage,
    badge: "FEATURED",
    featured: true,
    rating: 4.8,
    reviews: 2341,
    seating: "arena",
    about:
      "Experience LANY live with a full arena production, fan-favorite songs, stunning visuals, and an unforgettable night of music.",
    tiers: [
      {
        id: "vip",
        name: "VIP Standing",
        price: 8500,
        note: "Closest to the stage with VIP access",
        remaining: 12,
        seatZone: { rows: 2, seatsPerRow: 12 },
      },
      {
        id: "patron",
        name: "Patron",
        price: 6500,
        note: "Premium lower bowl seating",
        remaining: 38,
        seatZone: { rows: 4, seatsPerRow: 18, rowOffset: 2 },
      },
      {
        id: "lowerbox",
        name: "Lower Box",
        price: 4500,
        note: "Excellent views of the stage",
        remaining: 86,
        seatZone: { rows: 5, seatsPerRow: 20, rowOffset: 6 },
      },
      {
        id: "upperbox",
        name: "Upper Box",
        price: 3000,
        note: "Elevated arena seating",
        remaining: 160,
        seatZone: { rows: 5, seatsPerRow: 22, rowOffset: 11 },
      },
    ],
  },

   {
    slug: "taylor-swift-eras-tour",
    title: "Taylor Swift — The Eras Tour",
    subtitle: "A celebration of every Taylor Swift era",
    category: "Concerts",
    venue: "Philippine Arena",
    city: "Bulacan, Philippines",
    date: "Nov 15, 2026",
    time: "7:00 PM",
    image: taylorSwiftImage,
    badge: "HOT",
    rating: 4.9,
    reviews: 8721,
    seating: "arena",
    about:
      "A spectacular celebration spanning Taylor Swift's musical eras, featuring iconic songs, elaborate production, and a massive live stage show.",
    tiers: [
      {
        id: "vip",
        name: "VIP Floor",
        price: 15000,
        note: "Premium floor access closest to the stage",
        remaining: 8,
        seatZone: { rows: 2, seatsPerRow: 14 },
      },
      {
        id: "premium",
        name: "Premium Reserved",
        price: 10000,
        note: "Premium reserved lower-level seating",
        remaining: 24,
        seatZone: { rows: 4, seatsPerRow: 18, rowOffset: 2 },
      },
      {
        id: "lower",
        name: "Lower Bowl",
        price: 7500,
        note: "Great views from the lower sections",
        remaining: 72,
        seatZone: { rows: 5, seatsPerRow: 20, rowOffset: 6 },
      },
      {
        id: "upper",
        name: "Upper Bowl",
        price: 4500,
        note: "Affordable arena seating",
        remaining: 210,
        seatZone: { rows: 5, seatsPerRow: 22, rowOffset: 11 },
      },
    ],
  },
  {
    slug: "spider-man-brand-new-day",
    title: "Spider-Man: Brand New Day",
    subtitle: "Experience the latest Spider-Man adventure",
    category: "Movies",
    venue: "SM Cinema IMAX",
    city: "Pasay City, Philippines",
    date: "Jul 31, 2026",
    time: "7:00 PM",
    image: spidermanImage,
    badge: "NEW",
    rating: 4.8,
    reviews: 3842,
    seating: "cinema",
    about:
      "Watch Spider-Man's latest adventure on the giant IMAX screen with immersive sound and premium reserved seating.",
    tiers: [
      {
        id: "standard",
        name: "Standard",
        price: 350,
        note: "Regular cinema seating",
        remaining: 86,
        seatZone: { rows: 4, seatsPerRow: 14 },
      },
      {
        id: "imax",
        name: "IMAX",
        price: 650,
        note: "Premium IMAX presentation",
        remaining: 48,
        seatZone: { rows: 5, seatsPerRow: 16, rowOffset: 4 },
      },
      {
        id: "director",
        name: "Director's Club",
        price: 850,
        note: "Luxury recliner seating",
        remaining: 18,
        seatZone: { rows: 3, seatsPerRow: 10, rowOffset: 9 },
      },
    ],
  },

  {
    slug: "avengers-secret-wars",
    title: "Avengers: Secret Wars",
    subtitle: "The ultimate Marvel cinematic event",
    category: "Movies",
    venue: "Director's Club Cinema",
    city: "Makati City, Philippines",
    date: "Dec 18, 2026",
    time: "6:30 PM",
    image: avengersImage,
    badge: "FEATURED",
    rating: 4.9,
    reviews: 5126,
    seating: "cinema",
    about:
      "Experience the next massive Marvel adventure with premium cinema presentation, immersive sound, and reserved seating.",
    tiers: [
      {
        id: "regular",
        name: "Regular",
        price: 400,
        note: "Standard premium cinema seating",
        remaining: 94,
        seatZone: { rows: 4, seatsPerRow: 14 },
      },
      {
        id: "premium",
        name: "Premium",
        price: 550,
        note: "Center seating with enhanced viewing",
        remaining: 52,
        seatZone: { rows: 4, seatsPerRow: 14, rowOffset: 4 },
      },
      {
        id: "director",
        name: "Director's Club",
        price: 850,
        note: "Luxury reclining seats",
        remaining: 16,
        seatZone: { rows: 3, seatsPerRow: 10, rowOffset: 8 },
      },
    ],
  },

  {
    slug: "tedx-manila-ideas-that-matter",
    title: "TEDx Manila: Ideas That Matter",
    subtitle: "Ideas, stories, and conversations that inspire",
    category: "Events",
    venue: "The Theatre at Solaire",
    city: "Parañaque City, Philippines",
    date: "Sep 26, 2026",
    time: "1:00 PM",
    image: tedtalkImage,
    badge: "FEATURED",
    rating: 4.7,
    reviews: 824,
    seating: "cinema",
    about:
      "An inspiring day of talks and conversations featuring innovators, entrepreneurs, creatives, and changemakers sharing ideas worth spreading.",
    tiers: [
      {
        id: "standard",
        name: "General Admission",
        price: 1500,
        note: "Standard event admission",
        remaining: 180,
        seatZone: { rows: 6, seatsPerRow: 14 },
      },
      {
        id: "premium",
        name: "Premium",
        price: 2500,
        note: "Premium seating near the stage",
        remaining: 64,
        seatZone: { rows: 4, seatsPerRow: 14, rowOffset: 6 },
      },
      {
        id: "vip",
        name: "VIP",
        price: 4500,
        note: "Best seats plus networking access",
        remaining: 22,
        seatZone: { rows: 3, seatsPerRow: 10, rowOffset: 10 },
      },
    ],
  },

  {
    slug: "manila-game-creative-expo",
    title: "Manila Game & Creative Expo",
    subtitle: "Gaming, design, technology, and creativity",
    category: "Events",
    venue: "SMX Convention Center",
    city: "Pasay City, Philippines",
    date: "Oct 10, 2026",
    time: "10:00 AM",
    image: expoImage,
    badge: "NEW",
    rating: 4.6,
    reviews: 1247,
    about:
      "A full-day creative expo featuring gaming showcases, design talks, technology demonstrations, workshops, and networking opportunities.",
    tiers: [
      {
        id: "day-pass",
        name: "Day Pass",
        price: 750,
        note: "Full-day expo access",
        remaining: 420,
      },
      {
        id: "premium",
        name: "Premium Pass",
        price: 1500,
        note: "Priority access and workshop entry",
        remaining: 120,
      },
      {
        id: "vip",
        name: "VIP Pass",
        price: 2500,
        note: "VIP lounge and exclusive sessions",
        remaining: 40,
      },
    ],
  },
];

export const SERVICE_FEE_RATE = 0.08;

export function getEvent(slug: string) {
  return EVENTS.find((event) => event.slug === slug);
}

export function formatPrice(value: number) {
  return value.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
  });
}
