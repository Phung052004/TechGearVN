import axios from "axios";

const baseURL =
  (import.meta.env.VITE_API_URL ?? "").trim() ||
  "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    if (!config.headers.Authorization && !config.headers.authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Keep errors consistent for callers
    return Promise.reject(error);
  },
);
