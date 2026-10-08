import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { AdminPage } from "@/lib/admin";
import { Button } from "@/components/ui/button";
export function CustomerDirectory() {
  const [result, setResult] = useState<AdminPage | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ q: search, page: String(page) });
    apiRequest<AdminPage>(`/admin/customers?${params}`)
      .then((data) => {
        if (!active) return;
        setResult(data);
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
  }, [search, page, refresh]);
  function reload() {
    setLoading(true);
    setRefresh((v) => v + 1);
  }
  return (
    <section className="space-y-5 rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold capitalize">Customers</h2>
        <Button variant="outline" onClick={reload} disabled={loading}>
          Refresh
        </Button>
      </div>
      {
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
            aria-label="Search customers"
            maxLength={200}
            className="min-w-0 flex-1 rounded-lg border bg-background p-3"
            placeholder="Name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <Button disabled={loading}>Search</Button>
        </form>
      }
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : loading ? (
        <p role="status">Loading…</p>
      ) : (
        result && (
          <>
            <p className="text-sm text-muted-foreground">{result.total} accounts</p>
            {result.data.length === 0 && <p>No matching records.</p>}
            <div className="space-y-3">
              {result.data.map((row) => (
                <article key={row.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="font-semibold">{row.name}</h3>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs">
                      {row.is_admin ? "Administrator" : "Customer"}
                    </span>
                  </div>

                  <p className="break-all text-sm text-muted-foreground">{row.email}</p>
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
