const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://digital-innovation-hub-for-mint.onrender.com/api";

/**
 * Central API helper for the MinT portal.
 * - Attaches JWT from localStorage
 * - Clears session on 401 (expired / invalid token)
 * - Supports JSON and FormData bodies
 * - Supports blob downloads
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("dih_token");
  const isFormData = options.body instanceof FormData;
  const controller = options.timeoutMs ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), options.timeoutMs)
    : null;

  const config = {
    method: options.method || "GET",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(!isFormData && !options.blob && { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  };

  if (options.body) {
    config.body = isFormData ? options.body : JSON.stringify(options.body);
  }

  if (controller) config.signal = controller.signal;

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, config);
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("The request timed out. Please try again.");
    }
    throw error;
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }

  // Session expired or invalid
  if (res.status === 401) {
    localStorage.removeItem("dih_token");
    localStorage.removeItem("dih_user");
    if (!window.location.pathname.startsWith("/login")) {
      window.location.assign("/login");
    }
    throw new Error("Session expired. Please sign in again.");
  }

  if (options.blob) {
    if (!res.ok) {
      let message = "Download failed";
      try {
        const err = await res.json();
        message = err.message || message;
      } catch {
        // ignore
      }
      throw new Error(message);
    }
    return res.blob();
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid response from server");
  }

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export function getApiBase() {
  return API_BASE;
}
