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
  const [user, setUser] = useState<{ name: string; is_admin?: boolean } | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [authError, setAuthError] = useState("");
  useEffect(() => {
    let active = true;
    const refresh = () => {
      apiRequest<{ user: { name: string; is_admin?: boolean } }>("/me")
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
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={logo} alt="Tixora" width={112} height={32} className="h-7 w-auto sm:h-12" />
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
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex md:hidden">
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
              <Button asChild variant="outline" className="gap-2 px-3 text-xs sm:text-sm">
                <Link to="/bookings">
                  <Ticket className="size-4" />
                  My bookings
                </Link>
              </Button>
              <details className="relative">
                <summary className="cursor-pointer whitespace-nowrap rounded-lg border px-3 py-2 text-sm">
                  Account
                </summary>
                <div className="absolute right-0 top-12 flex w-52 flex-col gap-3 rounded-xl border bg-background p-4 shadow-lg">
                  <span className="truncate font-semibold">{user.name}</span>
                  <Link to="/bookings">My bookings</Link>
                  <a href="/favorites">Saved events</a>
                  <Link to="/settings">Settings</Link>
                  {user.is_admin && <Link to="/admin">Admin dashboard</Link>}
                  <Button variant="outline" disabled={signingOut} onClick={logout}>
                    {signingOut ? "Signing out..." : "Sign out"}
                  </Button>
                </div>
              </details>
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
        </div>
      </div>
    </header>
  );
}
