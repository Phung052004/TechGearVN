import { apiClient } from "./apiClient";

async function listUsers(params = {}) {
  const res = await apiClient.get("/users", { params });
  return res.data;
}

async function createUser(payload) {
  const res = await apiClient.post("/users", payload);
  return res.data;
}

async function setBlocked(id, isBlocked) {
  const res = await apiClient.patch(`/users/${id}/block`, { isBlocked });
  return res.data;
}

async function setRole(id, role) {
  const res = await apiClient.patch(`/users/${id}/role`, { role });
  return res.data;
}

export const userAdminService = { listUsers, createUser, setBlocked, setRole };
