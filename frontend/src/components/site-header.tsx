import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Link } from "@tanstack/react-router";
import { Search, Ticket } from "lucide-react";

import logo from "@/assets/Official_Tixora_Logo.png";
import { Button } from "@/components/ui/button";

const NAV = [
  { label: "Concerts", to: "/events", search: { q: undefined, category: "Concerts" as const } },
  { label: "Movies", to: "/events", search: { q: undefined, category: "Movies" as const } },
  { label: "Events", to: "/events", search: { q: undefined, category: "Events" as const } },
] as const;

export function SiteHeader() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [authError, setAuthError] = useState("");
  useEffect(() => {
    let active = true;
    const refresh = () => {
      apiRequest<{ user: { name: string } }>("/me")
        .then((data) => {
          if (active) setUser(data.user);
        })
        .catch(() => {
          if (active) setUser(null);
        });
    };
    refresh();
    window.addEventListener("auth-changed", refresh);
    return () => {
      active = false;
      window.removeEventListener("auth-changed", refresh);
    };
  }, []);

  async function logout() {
    setSigningOut(true);
    setAuthError("");
    try {
      await apiRequest("/logout", { method: "POST" });
      setUser(null);
      window.dispatchEvent(new Event("auth-changed"));
    } catch {
      setAuthError("Sign out failed. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={logo} alt="Tixora" width={112} height={32} className="h-12 w-auto" />
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

          {authError ? (
            <span role="alert" className="text-xs text-destructive">
              {authError}
            </span>
          ) : null}
          {user ? (
            <>
              <span className="hidden text-sm sm:inline">{user.name}</span>
              <Button asChild variant="ghost"><Link to="/settings">Settings</Link></Button>
              <Button variant="outline" disabled={signingOut} onClick={logout}>
                {signingOut ? "Signing out..." : "Sign out"}
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild variant="outline" className="hidden sm:inline-flex">
                <Link to="/register">Sign up</Link>
              </Button>
            </>
          )}

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
