import axios from "axios";

const axiosClient = axios.create({
  baseURL:
    (import.meta?.env?.VITE_API_URL ?? "").trim() ||
    "http://localhost:5000/api/v1", // Đường dẫn gốc tới Backend
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
