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

export async function getAllSuppliers() {
  const { data } = await apiClient.get("/suppliers");
  return unwrap(data);
}
