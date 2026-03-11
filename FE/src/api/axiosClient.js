import axios from "axios";

const getBaseURL = () => {
  const raw = (import.meta.env.VITE_API_URL ?? "").trim();
  const isLocalhost = /^https?:\/\/localhost(?::\d+)?(\/|$)/i.test(raw);

  // In production, default to same-origin API to work on all devices.
  if (import.meta.env.PROD) {
    return raw && !isLocalhost ? raw : "/api/v1";
  }

  // In dev, allow env override; fallback to local backend.
  return raw || "http://localhost:5000/api/v1";
};

const axiosClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    if (!config.headers.Authorization && !config.headers.authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default axiosClient;
