import { getStoredToken, clearStoredAuth } from "./lib/authStorage";

// Default: same-origin API through Nginx proxy
// const localApiBase = "http://95.111.224.58:3001/api";
const DEFAULT_API_BASE = "/api";

const getApiBase = () => {
  const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE;

  // If someone sets http://... while app is on https, auto-upgrade
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
  return `${base}${route}`; // e.g. "/api" + "/auth/login" => "/api/auth/login"
};

export async function apiRequest(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  
  const headers = {};
  
  // Only set Content-Type for non-FormData requests
  // FormData needs to set its own Content-Type with boundary
  if (!isFormData && !options.headers?.["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  
  // Merge any custom headers (but don't override FormData's Content-Type)
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

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
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401 && path !== "/auth/login" && path !== "/auth/register") {
      // Clear stored auth on 401 to trigger re-login
      // Don't clear for login/register endpoints to avoid infinite loops
      if (typeof window !== "undefined") {
        clearStoredAuth();
        // Only redirect if we're not already on login page
        if (window.location.pathname !== "/login") {
          // Use a small delay to allow error handling to complete
          setTimeout(() => {
            window.location.href = "/login?expired=true";
          }, 100);
        }
      }
      throw new Error("Session expired. Please login again.");
    }
    
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
