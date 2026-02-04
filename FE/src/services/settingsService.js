import { apiClient } from "./apiClient";

async function getSettings() {
  const res = await apiClient.get("/settings");
  return res.data;
}

async function updateSettings(patch) {
  const res = await apiClient.put("/settings", patch);
  return res.data;
}

export const settingsService = { getSettings, updateSettings };
