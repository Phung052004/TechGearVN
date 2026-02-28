import { apiClient } from "./apiClient";

function unwrap(payload, depth = 0) {
  if (depth > 4) return payload;
  if (payload == null) return payload;

  if (typeof payload === "object" && !Array.isArray(payload)) {
    if (Object.prototype.hasOwnProperty.call(payload, "data")) {
      return unwrap(payload.data, depth + 1);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "result")) {
      return unwrap(payload.result, depth + 1);
    }
  }

  return payload;
}

function normalizeBuild(payload) {
  const u = unwrap(payload);
  if (u && typeof u === "object" && !Array.isArray(u)) {
    if (u.build) return u.build;
    if (u.item) return u.item;
  }
  return u;
}

function normalizeBuildList(payload) {
  const u = unwrap(payload);
  if (Array.isArray(u)) return u;
  if (u && typeof u === "object") {
    if (Array.isArray(u.builds)) return u.builds;
    if (Array.isArray(u.items)) return u.items;
  }
  return [];
}

export async function getMyBuilds() {
  const { data } = await apiClient.get("/saved-builds/me");
  return normalizeBuildList(data);
}

export async function createBuild(payload) {
  const { data } = await apiClient.post("/saved-builds", payload);
  return normalizeBuild(data);
}

export async function getBuildByIdOrShare(idOrShare) {
  const { data } = await apiClient.get(`/saved-builds/${idOrShare}`);
  return normalizeBuild(data);
}

export async function updateBuild(id, payload) {
  const { data } = await apiClient.put(`/saved-builds/${id}`, payload);
  return normalizeBuild(data);
}

export async function deleteBuild(id) {
  const { data } = await apiClient.delete(`/saved-builds/${id}`);
  return data;
}
