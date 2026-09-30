import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api";
import type { EventCategory } from "@/lib/events";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Account settings | Tixora" }] }),
  component: SettingsPage,
});

type Profile = { name: string; username: string | null; email: string; preferences: { favorite_category?: string } | null };

function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [category, setCategory] = useState("All");
  const [savedCategory, setSavedCategory] = useState("All");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    let active = true;
    apiRequest<{ user: Profile }>("/me").then(({ user }) => {
      if (!active) return;
      setUser(user); setName(user.name); setUsername(user.username ?? "");
      setCategory(user.preferences?.favorite_category ?? "All");
      setSavedCategory(user.preferences?.favorite_category ?? "All");
    }).catch((err) => {
      if (active && err.status !== 401) setError(err.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const data = await apiRequest<{ user: Profile }>("/settings", {
        method: "PATCH", body: JSON.stringify({ name, username: username || null, preferences: { favorite_category: category } }),
      });
      setUser(data.user); setName(data.user.name); setUsername(data.user.username ?? ""); setSavedCategory(category);
      setMessage("Your settings have been saved.");
      window.dispatchEvent(new Event("auth-changed"));
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save settings."); }
    finally { setBusy(false); }
  }

  async function deleteAccount(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      await apiRequest("/account", { method: "DELETE", body: JSON.stringify({ password, confirmation }) });
      window.dispatchEvent(new Event("auth-changed"));
      await navigate({ to: "/" });
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to delete account."); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <p className="eyebrow text-primary">Your account</p>
        <h1 className="mt-1 text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">Make Tixora feel more like you.</p>
        {error && <p role="alert" className="mt-4 text-destructive">{error}</p>}
        {message && <p role="status" className="mt-4 text-primary">{message}</p>}
        {loading ? <p className="mt-8" role="status">Loading settings...</p> : !user ? (
          <div className="mt-8 space-y-4"><p>Sign in to manage your account settings.</p><Button asChild><Link to="/login">Sign in</Link></Button></div>
        ) : <>
          <form onSubmit={save} className="mt-8 space-y-6 rounded-3xl border bg-card p-6 shadow-card">
            <h2 className="text-xl font-semibold">Profile</h2>
            <div className="space-y-2"><Label htmlFor="profile-name">Name</Label><Input id="profile-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={255} disabled={busy} /></div>
            <div className="space-y-2"><Label htmlFor="profile-username">Username</Label><Input id="profile-username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} minLength={3} maxLength={30} pattern="[a-z0-9_]+" aria-describedby="username-help" disabled={busy} /><p id="username-help" className="text-sm text-muted-foreground">Optional. Use 3–30 letters, numbers or underscores. Continue signing in with your email.</p></div>
            <div className="space-y-2"><Label htmlFor="profile-email">Email</Label><Input id="profile-email" value={user.email} readOnly /></div>
            <h2 className="border-t pt-6 text-xl font-semibold">Preferences</h2>
            <div className="space-y-2"><Label htmlFor="favorite-category">Favorite event category</Label><select id="favorite-category" value={category} onChange={(e) => setCategory(e.target.value)} disabled={busy} className="h-11 w-full rounded-md border border-input bg-background px-3">{["All", "Concerts", "Movies", "Events"].map((value) => <option key={value} value={value}>{value}</option>)}</select><p className="text-sm text-muted-foreground">Save your favorite category, then browse it below.</p></div>
            <div className="flex flex-wrap gap-3"><Button disabled={busy} type="submit">{busy ? "Please wait..." : "Save changes"}</Button><Button asChild variant="outline"><Link to="/events" search={{ q: undefined, category: savedCategory === "All" ? undefined : savedCategory as EventCategory }}>Browse my favorites</Link></Button></div>
          </form>
          <section className="mt-6 rounded-3xl border border-destructive/40 bg-card p-6">
            <h2 className="text-xl font-semibold">Delete account</h2>
            <p className="mt-2 text-sm text-muted-foreground">Permanently delete your profile, saved preferences and associated bookings and tickets. This cannot be undone.</p>
            {!deleting ? <Button variant="destructive" className="mt-4" onClick={() => { setDeleting(true); setMessage(""); }} disabled={busy}>Delete my account</Button> : (
              <form onSubmit={deleteAccount} className="mt-4 space-y-4">
                <div className="space-y-2"><Label htmlFor="delete-password">Confirm your password</Label><Input id="delete-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={busy} /></div>
                <div className="space-y-2"><Label htmlFor="delete-confirmation">Type DELETE to confirm</Label><Input id="delete-confirmation" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required pattern="DELETE" disabled={busy} /></div>
                <div className="flex gap-3"><Button type="submit" variant="destructive" disabled={busy || confirmation !== "DELETE" || !password}>{busy ? "Please wait..." : "Permanently delete account"}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => { setDeleting(false); setPassword(""); setConfirmation(""); }}>Cancel</Button></div>
              </form>
            )}
          </section>
        </>}
      </main>
      <SiteFooter />
    </div>
  );
}
