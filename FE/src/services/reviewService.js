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

export async function getPendingReviews() {
  const { data } = await apiClient.get("/reviews/pending");
  return unwrap(data);
}

export async function moderateReview(reviewId, payload) {
  const { data } = await apiClient.put(
    `/reviews/${reviewId}/moderate`,
    payload,
  );
  return unwrap(data);
}
