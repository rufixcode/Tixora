import { apiBaseUrl } from "@/config/api";

export function mediaUrl(value?: string | null) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim(), apiBaseUrl.replace(/\/api$/, "") + "/");
    return url.protocol === "https:" || (__DEV__ && url.protocol === "http:")
      ? url.href
      : null;
  } catch {
    return null;
  }
}
