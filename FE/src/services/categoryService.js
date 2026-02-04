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

function normalizeCategoryList(payload) {
  const unwrapped = unwrapCommonEnvelope(payload);
  if (Array.isArray(unwrapped)) return unwrapped;

  if (unwrapped && typeof unwrapped === "object") {
    if (Array.isArray(unwrapped.categories)) return unwrapped.categories;
    if (Array.isArray(unwrapped.items)) return unwrapped.items;
    if (Array.isArray(unwrapped.rows)) return unwrapped.rows;
    if (unwrapped.data) return normalizeCategoryList(unwrapped.data);
  }

  return [];
}

export async function getCategories(params) {
  const { data } = await apiClient.get("/categories", { params });
  return normalizeCategoryList(data);
}

export async function getCategoryByIdOrSlug(idOrSlug) {
  const { data } = await apiClient.get(`/categories/${idOrSlug}`);
  return unwrapCommonEnvelope(data);
}
