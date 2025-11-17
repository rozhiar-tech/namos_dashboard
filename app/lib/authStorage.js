const AUTH_STORAGE_KEY = "namo_admin_auth";

const safeJsonParse = (payload) => {
  try {
    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
};

export function loadStoredAuth() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  return safeJsonParse(raw);
}

export function storeAuthSession(session) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getStoredToken() {
  return loadStoredAuth()?.token ?? null;
}

export function getStoredUser() {
  return loadStoredAuth()?.user ?? null;
}
