import { apiClient } from "./apiClient";

async function getBanners() {
  const res = await apiClient.get("/banners");
  return res.data;
}

async function createBanner(payload) {
  const res = await apiClient.post("/banners", payload);
  return res.data;
}

async function updateBanner(id, payload) {
  const res = await apiClient.put(`/banners/${id}`, payload);
  return res.data;
}

async function deleteBanner(id) {
  const res = await apiClient.delete(`/banners/${id}`);
  return res.data;
}

export const bannerService = {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
