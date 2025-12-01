import { getStoredToken } from "./lib/authStorage";

const DEFAULT_API_BASE = "https://95.111.224.58:3001/api";

const getApiBase = () => {
  const rawBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE;

  // Avoid mixed content when the app is served over HTTPS
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    rawBase.startsWith("http://")
  ) {
    return `https://${rawBase.slice("http://".length)}`;
  }

  return rawBase;
};

const buildUrl = (path) => {
  const apiBase = getApiBase();
  const base = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
  const route = path.startsWith("/") ? path : `/${path}`;
  return `${base}${route}`;
};

export async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const explicitToken =
    typeof options.token === "string" && options.token.length > 0
      ? options.token
      : null;
  const storedToken = getStoredToken();
  const envToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN;
  const token = explicitToken || storedToken || envToken;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch (_) {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  try {
    return await response.json();
  } catch (_) {
    return null;
  }
}
