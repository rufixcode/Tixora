import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
export function FavoriteButton({
  slug,
  initialSaved,
  onChange,
}: {
  slug: string;
  initialSaved?: boolean;
  onChange?: (saved: boolean) => void;
}) {
  const [saved, setSaved] = useState(initialSaved ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (initialSaved !== undefined) return;
    let active = true;
    apiRequest<{ slug: string }[]>("/favorites")
      .then((items) => {
        if (active) setSaved(items.some((e) => e.slug === slug));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [slug, initialSaved]);
  async function toggle() {
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/favorites/${encodeURIComponent(slug)}`, {
        method: saved ? "DELETE" : "PUT",
      });
      setSaved(!saved);
      onChange?.(!saved);
    } catch (e) {
      setError(
        (e as { status?: number }).status === 401
          ? "Sign in to save events."
          : "Could not update favorites.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <Button variant="outline" disabled={busy} onClick={toggle}>
        {saved ? "Saved - remove" : "Save event"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
