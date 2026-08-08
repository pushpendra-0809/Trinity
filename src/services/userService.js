import { apiRequest } from "./api";

export async function getProfile() {
  return apiRequest("/users/profile");
}

export async function updateProfile(data) {
  return apiRequest("/users/profile", {
    method: "PUT",
    body: data,
  });
}
