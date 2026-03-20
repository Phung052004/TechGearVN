import { apiClient } from "./apiClient";

function unwrap(payload) {
  if (payload && typeof payload === "object") {
    if (Object.prototype.hasOwnProperty.call(payload, "data"))
      return payload.data;
    if (Object.prototype.hasOwnProperty.call(payload, "result"))
      return payload.result;
  }
  return payload;
}

export async function createClaim(payload) {
  const { data } = await apiClient.post("/warranty-claims", payload);
  return unwrap(data);
}

export async function getMyClaims() {
  const { data } = await apiClient.get("/warranty-claims/me");
  return unwrap(data);
}

export async function getClaimsByOrder(orderId) {
  const { data } = await apiClient.get(`/warranty-claims/order/${orderId}`);
  return unwrap(data);
}

export async function getAllClaims(status = null) {
  const url = status ? `/warranty-claims?status=${status}` : "/warranty-claims";
  const { data } = await apiClient.get(url);
  return unwrap(data);
}

export async function getStats() {
  const { data } = await apiClient.get("/warranty-claims/stats");
  return unwrap(data);
}

export async function updateClaim(claimId, payload) {
  const { data } = await apiClient.put(`/warranty-claims/${claimId}`, payload);
  return unwrap(data);
}

export async function rejectClaim(claimId, reason) {
  const { data } = await apiClient.post(`/warranty-claims/${claimId}/reject`, {
    reason,
  });
  return unwrap(data);
}

export async function approveClaim(claimId, resolution) {
  const { data } = await apiClient.post(`/warranty-claims/${claimId}/approve`, {
    resolution,
  });
  return unwrap(data);
}
