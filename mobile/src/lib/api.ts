import { apiBaseUrl } from "@/config/api";
import { mediaUrl } from "@/lib/media";

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
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...fetchOptions,
      headers,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(
      "Cannot reach Tixora. Check your connection. If it continues, check the mobile API URL and allow this website address in the backend's CORS settings.",
    );
  }
  const body = response.headers
    .get("content-type")
    ?.includes("application/json")
    ? JSON.parse(await response.text(), (key, value) =>
        key === "image" && typeof value === "string" ? mediaUrl(value) : value,
      )
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
