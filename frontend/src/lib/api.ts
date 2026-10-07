// Browsers use same-origin session routes; SSR only reads public API data.
function baseUrl() {
  if (import.meta.env.SSR) {
    return (process.env["API_INTERNAL_URL"] ?? "http://127.0.0.1:8000/api").replace(/\/+$/, "");
  }
  return "/web";
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!endpoint.startsWith("/") || endpoint.startsWith("//")) throw new Error("Invalid API path.");
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (!import.meta.env.SSR) {
    // Remove credentials left behind by the previous web client.
    try {
      localStorage.removeItem("tixora_token");
      localStorage.removeItem("tixora_user");
    } catch {
      /* Browser storage may be disabled. */
    }
    if (!["GET", "HEAD", "OPTIONS"].includes((options.method ?? "GET").toUpperCase())) {
      const csrf = await fetch("/sanctum/csrf-cookie", {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!csrf.ok) throw new Error("Unable to initialize a secure session.");
      const cookie = document.cookie.split("; ").find((value) => value.startsWith("XSRF-TOKEN="));
      if (!cookie) throw new Error("Please enable cookies and try again.");
      headers.set("X-XSRF-TOKEN", decodeURIComponent(cookie.slice("XSRF-TOKEN=".length)));
    }
  }
  const response = await fetch(`${baseUrl()}${endpoint}`, {
    ...options,
    headers,
    credentials: "same-origin",
  });
  const body = response.headers.get("content-type")?.includes("application/json")
    ? await response.json()
    : null;
  if (!response.ok) {
    const message =
      response.status >= 500 && response.status !== 503
        ? "The service is temporarily unavailable. Please try again later."
        : typeof body?.message === "string"
          ? body.message
          : "Unable to complete the request.";
    throw Object.assign(new Error(message), { status: response.status });
  }
  return body as T;
}
