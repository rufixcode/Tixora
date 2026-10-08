import { useState } from "react";
import { apiRequest } from "@/lib/api";
import type { TixEvent } from "@/lib/events";
import { Button } from "@/components/ui/button";
const blank = { name: "", description: "", price: "", quantity: "" };
export function TierEditor({ event, onSaved }: { event: TixEvent; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState(blank);
  const [id, setId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const base = `/admin/events/${event.resource_type}/${event.resource_id}/tiers`;
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiRequest(id ? `${base}/${id.replace("ticket-", "")}` : base, {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      setForm(blank);
      setId(null);
      await onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(tier: string) {
    if (!window.confirm("Delete this ticket tier?")) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest(`${base}/${tier.replace("ticket-", "")}`, { method: "DELETE" });
      setForm(blank);
      setId(null);
      await onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-3 rounded-xl border p-4">
      <h3 className="font-bold">Ticket tiers · {event.title}</h3>
      <p className="text-sm">Manage tiers before bookings start. At least one tier must remain.</p>
      {event.tiers.map((t) => (
        <div key={t.id} className="flex flex-wrap items-center gap-2 border-b pb-2">
          <span>
            {t.name} · PHP {t.price} · {t.remaining} available
          </span>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              setId(t.id);
              setForm({
                name: t.name,
                description: t.note,
                price: String(t.price),
                quantity: String(t.remaining),
              });
            }}
          >
            Edit tier
          </Button>
          <Button
            variant="ghost"
            disabled={busy || event.tiers.length <= 1}
            onClick={() => void remove(t.id)}
          >
            Delete tier
          </Button>
        </div>
      ))}
      <form onSubmit={save} className="space-y-2">
        <h4>{id ? "Edit tier" : "Add tier"}</h4>
        {(Object.keys(blank) as (keyof typeof blank)[]).map((k) => (
          <label className="block" key={k}>
            {k}
            <input
              aria-label={`Tier ${k}`}
              value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              type={["price", "quantity"].includes(k) ? "number" : "text"}
              required={k !== "description"}
              min={1}
              max={k === "quantity" ? 200 : undefined}
              step={k === "price" ? "0.01" : undefined}
              disabled={busy}
              className="block w-full rounded border bg-background p-2"
            />
          </label>
        ))}
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        <Button disabled={busy}>Save tier</Button>
        {id && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setId(null);
              setForm(blank);
            }}
          >
            Cancel tier edit
          </Button>
        )}
      </form>
    </section>
  );
}
