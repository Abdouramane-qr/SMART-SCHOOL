export const API_BASE_URL =
  import.meta.env.VITE_LARAVEL_API_BASE_URL || "http://localhost:8000/api";

const apiOrigin = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "http://localhost:8000";
  }
})();

let csrfPromise: Promise<void> | null = null;

const getCookie = (name: string) => {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : "";
};

const ensureCsrfCookie = async () => {
  if (!csrfPromise) {
    csrfPromise = fetch(`${apiOrigin}/sanctum/csrf-cookie`, {
      credentials: "include",
    }).then(() => undefined);
  }
  await csrfPromise;
};

const parseJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export type ApiError = Error & {
  status?: number;
  code?: string;
  details?: Record<string, string[]>;
  payload?: unknown;
};

export const apiRequest = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const method = (options.method || "GET").toUpperCase();
  if (method !== "GET") {
    await ensureCsrfCookie();
  }

  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const body = options.body;
  const isFormData = body instanceof FormData;
  if (!isFormData && body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const xsrfToken = getCookie("XSRF-TOKEN");
  if (xsrfToken && !headers.has("X-XSRF-TOKEN")) {
    headers.set("X-XSRF-TOKEN", xsrfToken);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      payload?.error ||
      "Erreur lors de la requete";
    const error = new Error(message) as ApiError;
    error.status = response.status;
    if (payload?.error?.code || payload?.code) {
      error.code = payload?.error?.code || payload?.code;
    }
    if (payload?.errors && typeof payload.errors === "object") {
      error.details = payload.errors as Record<string, string[]>;
    }
    error.payload = payload;
    throw error;
  }

  return payload as T;
};

export const unwrapData = <T>(payload: any): { data: T; meta?: any } => {
  if (Array.isArray(payload)) {
    return { data: payload as T };
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return {
      data: payload.data as T,
      meta: (payload as { meta?: any }).meta,
    };
  }

  return { data: payload as T };
};
