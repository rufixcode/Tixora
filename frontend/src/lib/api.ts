const API_BASE_URL = ((import.meta.env as Record<string, string | undefined>).VITE_API_URL ?? "http://localhost:8000/api").replace(/\/+$/, "");

export type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[] | string>;
};

export function getStoredAuthToken(): string | null {
  return localStorage.getItem("tixora_token");
}

export function getStoredUser(): { name?: string; email?: string } | null {
  const storedUser = localStorage.getItem("tixora_user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

export function clearStoredAuth() {
  localStorage.removeItem("tixora_token");
  localStorage.removeItem("tixora_user");
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredAuthToken();
  const headers = new Headers(options.headers ?? {});

  headers.set("Accept", "application/json");

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    let message = "Something went wrong while contacting the server.";

    if (typeof body === "object" && body !== null) {
      const apiBody = body as ApiErrorPayload;

      if (apiBody.message) {
        message = apiBody.message;
      } else if (apiBody.errors) {
        const firstError = Object.values(apiBody.errors)[0];

        if (Array.isArray(firstError)) {
          message = firstError[0] ?? message;
        } else if (firstError) {
          message = firstError;
        }
      }
    } else if (typeof body === "string" && body) {
      message = body;
    }

    const error = new Error(message) as Error & { status?: number; data?: unknown };
    error.status = response.status;
    error.data = body;
    throw error;
  }

  return body as T;
}
