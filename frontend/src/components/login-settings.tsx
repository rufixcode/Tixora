import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
export function LoginSettings({ email }: { email: string }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email,
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiRequest("/settings/credentials", { method: "PATCH", body: JSON.stringify(form) });
      window.dispatchEvent(new Event("auth-changed"));
      await navigate({ to: "/login" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="mt-6 space-y-4 rounded-3xl border bg-card p-6">
      <h2 className="text-xl font-semibold">Change login details</h2>
      <p className="text-sm text-muted-foreground">
        Enter your current password to change your email or password. Leave the new password blank
        to keep it. Saving signs you out on all devices.
      </p>
      {(Object.keys(form) as (keyof typeof form)[]).map((k) => (
        <label key={k} className="block">
          {
            {
              email: "Email",
              current_password: "Current password",
              password: "New password (12+ characters)",
              password_confirmation: "Confirm new password",
            }[k]
          }
          <input
            className="mt-1 w-full rounded-lg border bg-background p-3"
            type={k === "email" ? "email" : "password"}
            autoComplete={
              k === "email"
                ? "email"
                : k === "current_password"
                  ? "current-password"
                  : "new-password"
            }
            required={k === "email" || k === "current_password"}
            minLength={k === "password" ? 12 : undefined}
            maxLength={k === "email" ? 255 : 128}
            disabled={busy}
            value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
          />
        </label>
      ))}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <Button disabled={busy}>{busy ? "Saving…" : "Update login & sign out"}</Button>
    </form>
  );
}
