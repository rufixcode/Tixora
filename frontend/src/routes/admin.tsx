import { AdminReports } from "@/components/admin-reports";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import type { TixEvent } from "@/lib/events";
export const Route = createFileRoute("/admin")({ component: Admin });
const blank = {
  title: "",
  category: "Concerts",
  subtitle: "",
  about: "",
  venue: "",
  city: "",
  date: "",
  time: "",
  image: "",
  price: "",
  tickets: "",
};
function Admin() {
  const [section, setSection] = useState<"overview" | "events" | "bookings" | "customers">(
    "overview",
  );
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [archive, setArchive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<TixEvent[]>([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<TixEvent | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function load() {
    try {
      setItems(await apiRequest<TixEvent[]>("/admin/events"));
      setAllowed(true);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await apiRequest(
        editing ? `/admin/events/${editing.resource_type}/${editing.resource_id}` : "/admin/events",
        { method: editing ? "PATCH" : "POST", body: JSON.stringify(form) },
      );
      setForm(blank);
      setEditing(null);
      setMessage("Event saved. Both apps now read the same catalog.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(e: TixEvent) {
    if (!window.confirm(`Archive ${e.title}? It will be removed from both apps.`)) return;
    setBusy(true);
    try {
      await apiRequest(`/admin/events/${e.resource_type}/${e.resource_id}`, { method: "DELETE" });
      await load();
      setMessage("Listing archived and removed from both apps.");
      if (editing?.resource_type === e.resource_type && editing.resource_id === e.resource_id) {
        setEditing(null);
        setForm(blank);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function edit(e: TixEvent) {
    setEditing(e);
    const start = e.starts_at ?? "";
    setForm({
      title: e.title,
      category: e.category,
      subtitle: e.admin_subtitle ?? "",
      about: e.about,
      venue: e.venue,
      city: e.city,
      date: start.slice(0, 10),
      time: start.slice(11, 16),
      image: e.image ?? "",
      price: String(e.tiers[0]?.price ?? 0),
      tickets: String(e.tiers[0]?.remaining ?? 0),
    });
  }
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold">Admin dashboard</h1>
        <p className="my-4 text-muted-foreground">
          Manage your catalog and monitor bookings across web and mobile.
        </p>
        {error && (
          <p role="alert" className="my-4 text-destructive">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="my-4">
            {message}
          </p>
        )}
        {loading && <p role="status">Checking administrator access…</p>}
        {!loading && !allowed && (
          <div className="rounded-xl border p-5">
            <p>Sign in with an administrator account. Regular accounts cannot access this area.</p>
            <Link to="/login" className="mt-3 inline-block underline">
              Sign in
            </Link>
          </div>
        )}
        {allowed && (
          <nav aria-label="Admin sections" className="mb-6 flex flex-wrap gap-2">
            {(["overview", "events", "bookings", "customers"] as const).map((s) => (
              <Button
                key={s}
                variant={section === s ? "default" : "outline"}
                onClick={() => setSection(s)}
              >
                {s === "events" ? "Events & concerts" : s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </nav>
        )}
        {allowed && section !== "events" && <AdminReports key={section} section={section} />}
        {allowed && section === "events" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <form onSubmit={save} className="space-y-4 rounded-2xl border p-5">
              <h2 className="text-xl font-bold">{editing ? "Edit event" : "New event"}</h2>
              <label className="block">
                Category
                <select
                  disabled={!!editing}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="block w-full rounded border p-2"
                >
                  {["Concerts", "Movies", "Events"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              {(Object.keys(blank) as (keyof typeof blank)[])
                .filter((k) => k !== "category")
                .map((k) => (
                  <label key={k} className="block capitalize">
                    {k === "tickets"
                      ? "Capacity / lowest-priced tier"
                      : k === "time"
                        ? "Time (UTC)"
                        : k === "subtitle"
                          ? "Artist (concerts only)"
                          : k === "image"
                            ? "Poster URL (HTTPS, optional)"
                            : k}
                    <input
                      required={!["subtitle", "image"].includes(k)}
                      type={
                        k === "date"
                          ? "date"
                          : k === "time"
                            ? "time"
                            : ["price", "tickets"].includes(k)
                              ? "number"
                              : k === "image"
                                ? "url"
                                : "text"
                      }
                      min={["price", "tickets"].includes(k) ? 1 : undefined}
                      max={k === "tickets" ? 200 : undefined}
                      step={k === "price" ? "0.01" : undefined}
                      value={form[k]}
                      onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                      className="mt-1 block w-full rounded-lg border bg-background p-3"
                    />
                  </label>
                ))}
              <p className="text-sm text-muted-foreground">
                Movie listings create a two-hour screening with up to 200 seats. Listings with
                booking history cannot be changed or archived. Saving an archived listing publishes
                it again.
              </p>
              <Button disabled={busy}>
                {busy ? "Saving…" : editing ? "Save changes & publish" : "Publish event"}
              </Button>
              {editing && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditing(null);
                    setForm(blank);
                  }}
                >
                  Cancel edit
                </Button>
              )}
            </form>
            <div className="space-y-3">
              <h2 className="text-xl font-bold">Catalog</h2>
              <input
                aria-label="Search events"
                className="w-full rounded-lg border bg-background p-3"
                placeholder="Search title, venue or city"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="flex flex-wrap gap-3">
                <select
                  aria-label="Category filter"
                  className="rounded-lg border bg-background p-2"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {["All", "Concerts", "Events", "Movies"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={archive}
                    onChange={(e) => setArchive(e.target.checked)}
                  />
                  Archived listings
                </label>
                <Button variant="outline" disabled={busy} onClick={() => void load()}>
                  Refresh
                </Button>
              </div>
              {items.filter(
                (e) =>
                  (e.status === "cancelled") === archive &&
                  (category === "All" || category === e.category) &&
                  `${e.title} ${e.venue} ${e.city}`.toLowerCase().includes(search.toLowerCase()),
              ).length === 0 && (
                <p className="rounded-xl border p-5 text-muted-foreground">
                  No matching listings. Publish a new event using the form.
                </p>
              )}
              {items
                .filter(
                  (e) =>
                    (e.status === "cancelled") === archive &&
                    (category === "All" || category === e.category) &&
                    `${e.title} ${e.venue} ${e.city}`.toLowerCase().includes(search.toLowerCase()),
                )
                .map((e) => (
                  <article
                    key={`${e.resource_type}:${e.resource_id}`}
                    className="rounded-xl border p-4"
                  >
                    <h2 className="font-bold">{e.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {e.category} · {e.venue} · {e.date} ·{" "}
                      {e.status === "cancelled"
                        ? "Archived"
                        : e.booking_available
                          ? "On sale"
                          : "Ended / unavailable"}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" disabled={busy} onClick={() => edit(e)}>
                        {archive ? "Edit & republish" : "Edit"}
                      </Button>
                      {!archive && (
                        <Button variant="ghost" disabled={busy} onClick={() => remove(e)}>
                          Archive / delete
                        </Button>
                      )}
                    </div>
                  </article>
                ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
