import { Link } from "@tanstack/react-router";
import { Search, Ticket } from "lucide-react";

import logo from "@/assets/tixora-logo.png.asset.json";
import { Button } from "@/components/ui/button";

const NAV = [
  { label: "Concerts", to: "/events", search: { q: undefined, category: "Concerts" as const } },
  { label: "Movies", to: "/events", search: { q: undefined, category: "Movies" as const } },
  { label: "Festivals", to: "/events", search: { q: undefined, category: "Festivals" as const } },
  { label: "Theater", to: "/events", search: { q: undefined, category: "Theater" as const } },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={logo.url} alt="Tixora" width={112} height={32} className="h-8 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              search={item.search}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="md:hidden">
            <Link to="/events" search={{ q: undefined, category: undefined }}>
              <Search className="size-4" />
              <span className="sr-only">Browse events</span>
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link to="/events" search={{ q: undefined, category: undefined }}>
              <Ticket className="size-4" />
              Book tickets
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
