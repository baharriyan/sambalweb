/**
 * CSRF Token Management
 * Client-side utilities untuk manage CSRF tokens
 */

const CSRF_TOKEN_KEY = "X-CSRF-Token";
const CSRF_TOKEN_STORAGE_KEY = "csrf-token";

/**
 * Get CSRF token from response headers or local storage
 */
export function getCSRFToken(): string | null {
  // Try to get from localStorage first
  const stored = localStorage.getItem(CSRF_TOKEN_STORAGE_KEY);
  if (stored) {
    return stored;
  }

  // Try to get from meta tag
  const metaTag = document.querySelector(`meta[name="${CSRF_TOKEN_KEY}"]`);
  if (metaTag) {
    return metaTag.getAttribute("content");
  }

  return null;
}

/**
 * Store CSRF token in localStorage
 */
export function setCSRFToken(token: string): void {
  localStorage.setItem(CSRF_TOKEN_STORAGE_KEY, token);
}

/**
 * Fetch new CSRF token from server
 */
export async function fetchCSRFToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/csrf-token", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      console.error("Failed to fetch CSRF token");
      return null;
    }

    const token = response.headers.get(CSRF_TOKEN_KEY);
    if (token) {
      setCSRFToken(token);
      return token;
    }

    return null;
  } catch (error) {
    console.error("Error fetching CSRF token:", error);
    return null;
  }
}

/**
 * Add CSRF token to request headers
 */
export function addCSRFTokenToHeaders(headers: Record<string, string>): Record<string, string> {
  const token = getCSRFToken();
  if (token) {
    headers[CSRF_TOKEN_KEY] = token;
  }
  return headers;
}

/**
 * Create FormData with CSRF token
 */
export function createFormDataWithCSRFToken(formData?: FormData): FormData {
  const data = formData || new FormData();
  const token = getCSRFToken();
  if (token) {
    data.append("csrfToken", token);
  }
  return data;
}

/**
 * Fetch wrapper that automatically includes CSRF token
 */
export async function fetchWithCSRFToken(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getCSRFToken();

  const headers = {
    ...options.headers,
  } as Record<string, string>;

  // Add CSRF token for non-GET requests
  if (options.method && ["POST", "PUT", "DELETE", "PATCH"].includes(options.method)) {
    if (token) {
      headers[CSRF_TOKEN_KEY] = token;
    }
  }

  return fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });
}

/**
 * Initialize CSRF token on page load
 */
export function initializeCSRFToken(): void {
  fetchCSRFToken();
}
