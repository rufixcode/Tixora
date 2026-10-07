import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { AdminOverview, AdminPage } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/events";
export function AdminReports({ section }: { section: "overview" | "bookings" | "customers" }) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [result, setResult] = useState<AdminPage | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ q: search, page: String(page) });
    if (section === "bookings" && status) params.set("status", status);
    apiRequest<AdminOverview | AdminPage>(`/admin/${section}?${params}`)
      .then((data) => {
        if (!active) return;
        if (section === "overview") setOverview(data as AdminOverview);
        else setResult(data as AdminPage);
        setError("");
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [section, search, status, page, refresh]);
  function reload() {
    setLoading(true);
    setRefresh((v) => v + 1);
  }
  return (
    <section className="space-y-5 rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold capitalize">{section}</h2>
        <Button variant="outline" onClick={reload} disabled={loading}>
          Refresh
        </Button>
      </div>
      {section !== "overview" && (
        <form
          className="flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(query);
            reload();
          }}
        >
          <input
            aria-label={`Search ${section}`}
            maxLength={200}
            className="min-w-0 flex-1 rounded-lg border bg-background p-3"
            placeholder={
              section === "bookings"
                ? "Booking reference, event or customer email"
                : "Name or email"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {section === "bookings" && (
            <select
              aria-label="Booking status"
              className="rounded-lg border bg-background p-3"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
                setLoading(true);
              }}
            >
              <option value="">All statuses</option>
              {["pending", "confirmed", "cancelled"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          )}
          <Button disabled={loading}>Search</Button>
        </form>
      )}
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : loading ? (
        <p role="status">Loading…</p>
      ) : section === "overview" && overview ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Customers", overview.customers],
              ["Total bookings", overview.bookings],
              ["Awaiting payment", overview.pending],
              ["Confirmed bookings", overview.confirmed],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-muted p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <p className="text-lg">
            Confirmed sandbox payments: <strong>{formatPrice(overview.confirmed_amount)}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Use Events & concerts to publish listings, Bookings to monitor payment status, and
            Customers to find registered accounts. Payments are confirmed by PayMongo verification.
          </p>
        </>
      ) : (
        result && (
          <>
            <p className="text-sm text-muted-foreground">
              {result.total} records ·{" "}
              {section === "bookings"
                ? "Payment records are read-only; refunds are not connected."
                : "Account directory. Administrator roles are assigned through the trusted server console."}
            </p>
            {result.data.length === 0 && <p>No matching records.</p>}
            <div className="space-y-3">
              {result.data.map((row) => (
                <article key={row.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="font-semibold">{row.booking_reference ?? row.name}</h3>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs">
                      {row.status ?? (row.is_admin ? "Administrator" : "Customer")}
                    </span>
                  </div>
                  {row.event_title && (
                    <p className="mt-2">
                      {row.event_title} · {formatPrice(Number(row.total_amount))}
                    </p>
                  )}
                  <p className="break-all text-sm text-muted-foreground">
                    {row.customer ? `${row.customer} · ` : ""}
                    {row.email}
                  </p>
                  <p className="text-xs text-muted-foreground">Created {row.created_at} UTC</p>
                </article>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => {
                  setPage((p) => p - 1);
                  setLoading(true);
                }}
              >
                Previous
              </Button>
              <span>
                Page {result.current_page} of {result.last_page}
              </span>
              <Button
                variant="outline"
                disabled={page >= result.last_page}
                onClick={() => {
                  setPage((p) => p + 1);
                  setLoading(true);
                }}
              >
                Next
              </Button>
            </div>
          </>
        )
      )}
    </section>
  );
}
