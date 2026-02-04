import { apiClient } from "./apiClient";

async function getAnalyticsOverview(params = {}) {
  const res = await apiClient.get("/admin/analytics/overview", { params });
  return res.data;
}

export const adminService = { getAnalyticsOverview };
