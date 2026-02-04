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

export async function getAllClaims() {
  const { data } = await apiClient.get("/warranty-claims");
  return unwrap(data);
}

export async function updateClaim(claimId, payload) {
  const { data } = await apiClient.put(`/warranty-claims/${claimId}`, payload);
  return unwrap(data);
}
