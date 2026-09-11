import { createFileRoute } from "@tanstack/react-router";

import { LandingPage } from "@/features/landing/landing-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tixora — Book Tickets for Concerts, Movies & Festivals" },
      {
        name: "description",
        content:
          "Tixora is the fastest way to find and book tickets for concerts, movies, festivals and theater. Instant mobile entry, transparent pricing.",
      },
      { property: "og:title", content: "Tixora — Book Tickets for Live Events" },
      {
        property: "og:description",
        content: "Find concerts, movies, festivals and theater near you and book in seconds with Tixora.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});
