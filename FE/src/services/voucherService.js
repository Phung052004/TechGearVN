import { apiClient } from "./apiClient";

function unwrapCommonEnvelope(payload, depth = 0) {
  if (depth > 4) return payload;
  if (payload == null) return payload;

  if (typeof payload === "object" && !Array.isArray(payload)) {
    if (Object.prototype.hasOwnProperty.call(payload, "data")) {
      return unwrapCommonEnvelope(payload.data, depth + 1);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "result")) {
      return unwrapCommonEnvelope(payload.result, depth + 1);
    }
  }

  return payload;
}

function normalizeVoucherList(payload) {
  const unwrapped = unwrapCommonEnvelope(payload);
  if (Array.isArray(unwrapped)) return unwrapped;
  if (unwrapped && typeof unwrapped === "object") {
    if (Array.isArray(unwrapped.vouchers)) return unwrapped.vouchers;
    if (Array.isArray(unwrapped.items)) return unwrapped.items;
    if (Array.isArray(unwrapped.rows)) return unwrapped.rows;
  }
  return [];
}

export async function getVouchers(params) {
  const { data } = await apiClient.get("/vouchers", { params });
  return normalizeVoucherList(data);
}

export async function createVoucher(payload) {
  const { data } = await apiClient.post("/vouchers", payload);
  return unwrapCommonEnvelope(data);
}

export async function updateVoucher(voucherId, payload) {
  const { data } = await apiClient.put(`/vouchers/${voucherId}`, payload);
  return unwrapCommonEnvelope(data);
}

export async function deleteVoucher(voucherId) {
  const { data } = await apiClient.delete(`/vouchers/${voucherId}`);
  return unwrapCommonEnvelope(data);
}

export async function validateVoucher({ code, orderValue } = {}) {
  const { data } = await apiClient.get("/vouchers/validate", {
    params: {
      code,
      orderValue,
    },
  });
  return unwrapCommonEnvelope(data);
}
