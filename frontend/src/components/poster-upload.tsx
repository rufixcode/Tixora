import { useState } from "react";
import { apiRequest } from "@/lib/api";
export function PosterUpload({
  value,
  onChange,
  onBusy,
}: {
  value: string;
  onChange: (value: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    onBusy(true);
    setError("");
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Choose an image smaller than 5 MB.");
      const data = new FormData();
      data.append("image", file);
      const result = await apiRequest<{ image: string }>("/admin/images", {
        method: "POST",
        body: data,
      });
      onChange(result.image);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <div className="space-y-2 border-t pt-3">
      <label className="block font-semibold">
        Upload poster
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          className="mt-2 block w-full text-sm"
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      <p className="text-xs text-muted-foreground">
        JPG, PNG or WebP. Maximum 5 MB and 4096 × 4096 pixels. Save the event to attach the uploaded
        poster.
      </p>
      {busy && <p role="status">Uploading…</p>}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {value && (
        <>
          <img
            src={value}
            alt="Poster preview"
            className="h-40 max-w-full rounded border object-contain"
          />
          <button type="button" disabled={busy} className="underline" onClick={() => onChange("")}>
            Remove poster from this form
          </button>
        </>
      )}
    </div>
  );
}
