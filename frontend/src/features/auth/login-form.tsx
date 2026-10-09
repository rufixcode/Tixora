import { Link, useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api";
import { eventSlugFromNext } from "@/lib/login-return";

export function LoginForm() {
  const navigate = useNavigate();
  const router = useRouter();
  const { next } = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await apiRequest<{
        message: string;
        user: { name: string; email: string; is_admin: boolean };
      }>("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      window.dispatchEvent(new Event("auth-changed"));
      await router.invalidate();
      const slug = eventSlugFromNext(next);
      if (result.user.is_admin) await navigate({ to: "/admin" });
      else if (slug) await navigate({ to: "/events/$slug", params: { slug } });
      else await navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
          <p className="eyebrow text-primary">Welcome back</p>
          <h1 className="mt-1 text-3xl font-bold">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {next
              ? "Sign in to view this event and continue your booking."
              : "Access your tickets, saved events and booking history."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@email.com"
                  className="h-11 pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="h-11 pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to Tixora?{" "}
            <Link
              to="/register"
              search={{ next }}
              className="font-semibold text-primary hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
