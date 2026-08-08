import { apiRequest, setAuthToken } from "./api";

export async function login(credentials) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: credentials,
    auth: false,
  });

  if (data?.token) {
    setAuthToken(data.token);
  }

  return data;
}

export async function register(userData) {
  const data = await apiRequest("/auth/register", {
    method: "POST",
    body: userData,
    auth: false,
  });

  if (data?.token) {
    setAuthToken(data.token);
  }

  return data;
}

export async function logout() {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } finally {
    setAuthToken(null);
  }
}

export async function getCurrentUser() {
  return apiRequest("/auth/me");
}
