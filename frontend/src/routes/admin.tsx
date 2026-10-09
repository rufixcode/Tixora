import { TierEditor } from "@/components/tier-editor";
import { PosterUpload } from "@/components/poster-upload";
import { CustomerDirectory } from "@/components/customer-directory";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoginSettings } from "@/components/login-settings";
import { TicketCheckIn } from "@/components/ticket-check-in";
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
  const [section, setSection] = useState<"events" | "customers" | "account" | "tickets">("events");
  const [email, setEmail] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [tierTarget, setTierTarget] = useState<TixEvent | null>(null);
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
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  async function load() {
    try {
      const [events, user] = await Promise.all([
        apiRequest<TixEvent[]>("/admin/events"),
        apiRequest<{ user: { email: string } }>("/me"),
      ]);
      setItems(events);
      setEmail(user.user.email);
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
      setShowForm(false);
      setMessage("Listing saved.");
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
    setShowForm(true);
    setTierTarget(null);
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
      image: e.poster_path ?? e.image ?? "",
      price: String(e.tiers[0]?.price ?? 0),
      tickets: String(e.tiers[0]?.remaining ?? 0),
    });
  }
  const visibleItems = items.filter(
    (e) =>
      (e.status === "cancelled") === archive &&
      (category === "All" || category === e.category) &&
      `${e.title} ${e.venue} ${e.city}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-lg">Tixora · Administration</span>
        {allowed && (
          <Button
            variant="outline"
            disabled={busy || uploading}
            onClick={async () => {
              try {
                await apiRequest("/logout", { method: "POST" });
                window.location.assign("/login");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Sign out
          </Button>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold">Manage Tixora</h1>
        <p className="my-4 text-muted-foreground">Create and manage concerts, movies and events.</p>
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
            {(["events", "tickets", "customers", "account"] as const).map((s) => (
              <Button
                key={s}
                variant={section === s ? "default" : "outline"}
                disabled={busy || uploading}
                onClick={() => setSection(s)}
              >
                {s === "events"
                  ? "Listings"
                  : s === "account"
                    ? "Admin account"
                    : s === "tickets"
                      ? "Ticket check-in"
                      : "Customers"}
              </Button>
            ))}
          </nav>
        )}
        {allowed && section === "customers" && <CustomerDirectory />}
        {allowed && section === "tickets" && <TicketCheckIn />}
        {allowed && section === "account" && <LoginSettings email={email} />}
        {allowed && section === "events" && (
          <div className="space-y-6">
            {!showForm && !tierTarget && (
              <Button
                onClick={() => {
                  setForm(blank);
                  setEditing(null);
                  setShowForm(true);
                }}
              >
                Add listing
              </Button>
            )}
            {showForm && (
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
                  .filter(
                    (k) =>
                      k !== "category" &&
                      k !== "image" &&
                      (k !== "subtitle" || form.category === "Concerts"),
                  )
                  .map((k) => (
                    <label key={k} className="block capitalize">
                      {k === "tickets"
                        ? "Capacity / lowest-priced tier"
                        : k === "time"
                          ? "Time (UTC)"
                          : k === "subtitle"
                            ? "Artist"
                            : k === "about"
                              ? "Description"
                              : k === "price"
                                ? "Ticket price (PHP)"
                                : k}
                      {k === "about" ? (
                        <textarea
                          required
                          value={form.about}
                          onChange={(e) => setForm({ ...form, about: e.target.value })}
                          rows={4}
                          className="mt-1 block w-full rounded-lg border bg-background p-3"
                        />
                      ) : (
                        <input
                          required={k !== "subtitle"}
                          type={
                            k === "date"
                              ? "date"
                              : k === "time"
                                ? "time"
                                : ["price", "tickets"].includes(k)
                                  ? "number"
                                  : "text"
                          }
                          min={["price", "tickets"].includes(k) ? 1 : undefined}
                          max={k === "tickets" ? 200 : undefined}
                          step={k === "price" ? "0.01" : undefined}
                          value={form[k]}
                          onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                          className="mt-1 block w-full rounded-lg border bg-background p-3"
                        />
                      )}
                    </label>
                  ))}
                <PosterUpload
                  value={form.image}
                  onChange={(image) => setForm((prev) => ({ ...prev, image }))}
                  onBusy={setUploading}
                />
                <p className="text-sm text-muted-foreground">
                  Movie listings create a two-hour screening with up to 200 seats. Listings with
                  booking history cannot be changed or archived. Saving an archived listing
                  publishes it again.
                </p>
                <Button disabled={busy || uploading}>
                  {busy ? "Saving…" : editing ? "Save changes & publish" : "Publish event"}
                </Button>
                {
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy || uploading}
                    onClick={() => {
                      setEditing(null);
                      setForm(blank);
                      setShowForm(false);
                    }}
                  >
                    Cancel
                  </Button>
                }
              </form>
            )}
            {!showForm && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold">Catalog</h2>
                {tierTarget && (
                  <>
                    <Button variant="ghost" onClick={() => setTierTarget(null)}>
                      Close ticket tiers
                    </Button>
                    <TierEditor
                      key={`${tierTarget.resource_type}:${tierTarget.resource_id}`}
                      event={
                        items.find(
                          (e) =>
                            e.resource_type === tierTarget.resource_type &&
                            e.resource_id === tierTarget.resource_id,
                        ) ?? tierTarget
                      }
                      onSaved={load}
                    />
                  </>
                )}
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
                  <Button
                    variant="outline"
                    disabled={busy || uploading}
                    onClick={() => void load()}
                  >
                    Refresh
                  </Button>
                </div>
                {visibleItems.length === 0 && (
                  <p className="rounded-xl border p-5 text-muted-foreground">
                    No matching listings. Adjust your filters or add a listing.
                  </p>
                )}
                {visibleItems.map((e) => (
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
                    <div className="mt-3 flex flex-wrap gap-2">
                      {e.resource_type !== "movie" && !archive && (
                        <Button
                          variant="outline"
                          disabled={busy || uploading}
                          onClick={() => setTierTarget(e)}
                        >
                          Ticket tiers
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        disabled={busy || uploading}
                        onClick={() => edit(e)}
                      >
                        {archive ? "Edit & republish" : "Edit"}
                      </Button>
                      {!archive && (
                        <Button
                          variant="ghost"
                          disabled={busy || uploading}
                          onClick={() => remove(e)}
                        >
                          Archive
                        </Button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
