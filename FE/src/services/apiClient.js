import axios from "axios";

const getBaseURL = () => {
  const raw = (import.meta.env.VITE_API_URL ?? "").trim();
  const isLocalhost = /^https?:\/\/localhost(?::\d+)?(\/|$)/i.test(raw);

  if (import.meta.env.PROD) {
    return raw && !isLocalhost ? raw : "/api/v1";
  }

  return raw || "http://localhost:5000/api/v1";
};

const baseURL = getBaseURL();

export const apiClient = axios.create({
  baseURL,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  // Add auth token
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    if (!config.headers.Authorization && !config.headers.authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // Don't set Content-Type for FormData - let axios/browser handle it
  if (!(config.data instanceof FormData)) {
    if (!config.headers.get?.("Content-Type")) {
      config.headers["Content-Type"] = "application/json";
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
