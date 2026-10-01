import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  Search,
  Ticket,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES, fetchEvents, type EventCategory, type TixEvent } from "@/lib/events";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard | Tixora" }] }),
  component: AdminPage,
});

const STORAGE_KEY = "tixora-admin-events";
const blank = {
  title: "",
  subtitle: "",
  category: "Concerts" as EventCategory,
  venue: "",
  city: "",
  date: "",
  time: "",
  image: "",
  about: "",
  price: "",
  tickets: "",
};

async function loadEvents(): Promise<TixEvent[]> {
  let remoteEvents: TixEvent[] = [];
  try {
    remoteEvents = await fetchEvents();
  } catch {
    // Keep the dashboard usable when the events service is unavailable.
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const localEvents = saved ? (JSON.parse(saved) as TixEvent[]) : [];
    const localBySlug = new Map(localEvents.map((event) => [event.slug, event]));
    return [...localEvents, ...remoteEvents.filter((event) => !localBySlug.has(event.slug))];
  } catch {
    return remoteEvents;
  }
}

function AdminPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [events, setEvents] = useState<TixEvent[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<TixEvent | null>(null);
  const [form, setForm] = useState(blank);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("tixora-admin") !== "true") {
      void navigate({ to: "/login" });
      return;
    }
    void loadEvents().then((loadedEvents) => {
      setEvents(loadedEvents);
      setReady(true);
    });
  }, [navigate]);

  function updateEvents(next: TixEvent[]) {
    setEvents(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function startEdit(event?: TixEvent) {
    setEditing(event ?? null);
    setForm(
      event
        ? {
            title: event.title,
            subtitle: event.subtitle,
            category: event.category,
            venue: event.venue,
            city: event.city,
            date: event.date,
            time: event.time,
            image: event.image,
            about: event.about,
            price: String(event.tiers[0]?.price ?? 0),
            tickets: String(event.tiers[0]?.remaining ?? 0),
          }
        : blank,
    );
    setFormOpen(true);
  }

  function saveEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const slug =
      editing?.slug ??
      `${form.title}-${Date.now()}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    const item: TixEvent = {
      slug,
      title: form.title,
      subtitle: form.subtitle,
      category: form.category,
      venue: form.venue,
      city: form.city,
      date: form.date,
      time: form.time,
      image: form.image || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200",
      about: form.about,
      tiers: [
        {
          id: "general",
          name: "General Admission",
          price: Number(form.price),
          note: "Event admission",
          remaining: Number(form.tickets),
        },
      ],
    };
    updateEvents(
      editing
        ? events.map((event) => (event.slug === editing.slug ? item : event))
        : [item, ...events],
    );
    setFormOpen(false);
  }

  function logout() {
    sessionStorage.removeItem("tixora-admin");
    void navigate({ to: "/login" });
  }

  if (!ready) return null;
  const filtered = events.filter((event) =>
    `${event.title} ${event.venue} ${event.city}`.toLowerCase().includes(search.toLowerCase()),
  );
  const tickets = events.reduce(
    (sum, event) => sum + event.tiers.reduce((tierSum, tier) => tierSum + tier.remaining, 0),
    0,
  );

  return (
    <div className="min-h-screen bg-muted/30 lg:flex">
      <aside className="flex w-full flex-col bg-slate-950 p-5 text-white lg:min-h-screen lg:w-64">
        <Link to="/" className="text-2xl font-bold">
          tixora<span className="text-primary">.</span>
        </Link>
        <p className="mt-1 text-xs text-slate-400">EVENT MANAGEMENT</p>
        <nav className="mt-10 space-y-2">
          <a
            href="#overview"
            className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm"
          >
            <LayoutDashboard className="size-4" /> Overview
          </a>
          <a
            href="#events"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10"
          >
            <CalendarDays className="size-4" /> Events
          </a>
        </nav>
        <div className="mt-auto hidden border-t border-white/10 pt-5 lg:block">
          <p className="text-sm font-semibold">Administrator</p>
          <p className="text-xs text-slate-400">admin</p>
          <button
            onClick={logout}
            className="mt-4 flex items-center gap-2 text-sm text-slate-300 hover:text-white"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      <main id="overview" className="min-w-0 flex-1 p-5 sm:p-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back, Admin</p>
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/events">View storefront</Link>
            </Button>
            <Button variant="outline" onClick={logout} className="lg:hidden">
              <LogOut className="mr-2 size-4" /> Sign out
            </Button>
            <Button onClick={() => startEdit()}>
              <Plus className="mr-2 size-4" /> Add event
            </Button>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat icon={<CalendarDays />} label="Total events" value={events.length} />
          <Stat icon={<Ticket />} label="Tickets available" value={tickets.toLocaleString()} />
          <Stat icon={<LayoutDashboard />} label="Categories" value={CATEGORIES.length} />
        </section>

        <section id="events" className="mt-8 overflow-hidden rounded-2xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
            <div>
              <h2 className="text-lg font-bold">Events</h2>
              <p className="text-sm text-muted-foreground">Create and manage event listings.</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search events"
                className="pl-9"
              />
            </div>
          </div>
          <div className="divide-y">
            {filtered.map((event) => (
              <article key={event.slug} className="flex flex-wrap items-center gap-4 p-5">
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <CalendarDays className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{event.title}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" /> {event.venue}, {event.city}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">{event.date}</span>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                  {event.category}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Edit ${event.title}`}
                    onClick={() => startEdit(event)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Delete ${event.title}`}
                    onClick={() => {
                      if (window.confirm(`Delete ${event.title}?`))
                        updateEvents(events.filter((item) => item.slug !== event.slug));
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </article>
            ))}
            {filtered.length === 0 && (
              <p className="p-10 text-center text-sm text-muted-foreground">No events found.</p>
            )}
          </div>
        </section>
      </main>

      {formOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-dialog-title"
            className="my-8 w-full max-w-2xl rounded-2xl bg-background p-6 shadow-xl"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 id="event-dialog-title" className="text-xl font-bold">
                  {editing ? "Edit event" : "Add an event"}
                </h2>
                <p className="text-sm text-muted-foreground">Details shown to ticket buyers.</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close"
                onClick={() => setFormOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <form onSubmit={saveEvent} className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Event title"
                value={form.title}
                onChange={(title) => setForm({ ...form, title })}
                required
              />
              <Field
                label="Subtitle"
                value={form.subtitle}
                onChange={(subtitle) => setForm({ ...form, subtitle })}
                required
              />
              <label className="space-y-1.5 text-sm font-medium">
                Category
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3"
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value as EventCategory })
                  }
                >
                  {CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <Field
                label="Venue"
                value={form.venue}
                onChange={(venue) => setForm({ ...form, venue })}
                required
              />
              <Field
                label="City"
                value={form.city}
                onChange={(city) => setForm({ ...form, city })}
                required
              />
              <Field
                label="Date"
                value={form.date}
                onChange={(date) => setForm({ ...form, date })}
                required
              />
              <Field
                label="Time"
                value={form.time}
                onChange={(time) => setForm({ ...form, time })}
                required
              />
              <Field
                label="Ticket price (PHP)"
                type="number"
                value={form.price}
                onChange={(price) => setForm({ ...form, price })}
                required
              />
              <Field
                label="Tickets available"
                type="number"
                value={form.tickets}
                onChange={(tickets) => setForm({ ...form, tickets })}
                required
              />
              <div className="sm:col-span-2">
                <Field
                  label="Image URL (optional)"
                  value={form.image}
                  onChange={(image) => setForm({ ...form, image })}
                />
              </div>
              <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
                Description
                <textarea
                  className="min-h-24 w-full rounded-md border border-input bg-background p-3 text-sm"
                  value={form.about}
                  onChange={(event) => setForm({ ...form, about: event.target.value })}
                  required
                />
              </label>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editing ? "Save changes" : "Create event"}</Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium">
      {label}
      <Input
        type={type}
        min={type === "number" ? 0 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
