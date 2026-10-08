import { Link } from "@tanstack/react-router";

import logo from "@/assets/Official_Tixora_Logo.png";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="Tixora"
            width={98}
            height={28}
            loading="lazy"
            className="h-7 w-auto"
          />
          <span className="text-sm text-muted-foreground">Concerts, movies and events.</span>
        </div>
        <div className="flex gap-5 text-sm text-muted-foreground">
          <Link
            to="/events"
            search={{ q: undefined, category: undefined }}
            className="transition-colors hover:text-foreground"
          >
            All events
          </Link>
        </div>
      </div>
    </footer>
  );
}
