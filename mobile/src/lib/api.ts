import { apiBaseUrl } from "@/config/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}
type RequestOptions = RequestInit & { token?: string | null };

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (!path.startsWith("/") || path.startsWith("//"))
    throw new Error("Invalid API path.");
  if (!__DEV__ && !apiBaseUrl.startsWith("https://"))
    throw new ApiError(
      "Configure EXPO_PUBLIC_API_URL with your HTTPS backend before using a release build.",
    );
  const { token, ...fetchOptions } = options;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...fetchOptions,
    headers,
  });
  const body = response.headers
    .get("content-type")
    ?.includes("application/json")
    ? await response.json()
    : null;
  if (!response.ok) {
    const message =
      response.status >= 500 && response.status !== 503
        ? "The service is temporarily unavailable."
        : typeof body?.message === "string"
          ? body.message
          : "Unable to reach Tixora right now.";
    throw new ApiError(message, response.status);
  }
  return body as T;
}
