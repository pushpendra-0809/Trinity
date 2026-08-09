const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:8000/api" : "/api");

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getAuthToken() {
  return localStorage.getItem("trinity_auth_token");
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem("trinity_auth_token", token);
  } else {
    localStorage.removeItem("trinity_auth_token");
  }
}

export function isApiConfigured() {
  return Boolean(API_BASE_URL);
}

export async function apiRequest(path, options = {}) {
  const { method = "GET", body, headers = {}, auth = true } = options;

  const requestHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (auth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    data = await response.json();
  } else if (response.status !== 204) {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && data.message) ||
      (typeof data === "string" && data) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, data);
  }

  return data;
}
