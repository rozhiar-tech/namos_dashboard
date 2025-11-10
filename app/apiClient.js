const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://95.111.224.58:3001/api";

const buildUrl = (path) => {
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  const route = path.startsWith("/") ? path : `/${path}`;
  return `${base}${route}`;
};

export async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (process.env.NEXT_PUBLIC_ADMIN_TOKEN) {
    headers.Authorization = `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`;
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
