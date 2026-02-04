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

export async function createImportReceipt(payload) {
  const { data } = await apiClient.post("/import-receipts", payload);
  return unwrap(data);
}

export async function getImportReceipts() {
  const { data } = await apiClient.get("/import-receipts");
  return unwrap(data);
}
